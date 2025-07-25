/* eslint-disable no-extra-boolean-cast */
import { GameTag, PlayState, Step } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Replay } from './model/replay';

export const parseGame = (replay: Replay, parsers: readonly Parser[]) => {
	const opponentPlayerElement = replay.replay
		.findall('.//Player')
		.find((player) => player.get('isMainPlayer') === 'false');
	const opponentPlayerEntityId = opponentPlayerElement.get('id');
	const structure: ParsingStructure = {
		entities: {},
		gameEntityId: -1,
		currentTurn: 0,
		currentTurns: {},
		parsers: parsers,
	};
	const parserFunctions: readonly ((element: Element) => void)[] = [
		compositionForTurnParse(structure),
		...structure.parsers.map((parser) => parser.parse(structure)),
	];
	const populateFunctions: readonly ((currentTurn: number) => void)[] = [
		...structure.parsers.map((parser) => parser.populate(structure)),
	];
	parseElement(
		replay.replay.getroot(),
		replay.mainPlayerId,
		opponentPlayerEntityId,
		null,
		structure,
		parserFunctions,
		populateFunctions,
	);
};

// While we don't use the metric, the entity info that is populated is useful for other extractors
const compositionForTurnParse = (structure: ParsingStructure) => {
	return (element) => {
		if (element.tag === 'GameEntity') {
			structure.gameEntityId = parseInt(element.get('id'));
			structure.entities[structure.gameEntityId] = {
				entityId: structure.gameEntityId,
				controller: parseInt(element.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') || '-1'),
				boardVisualState: parseInt(
					element.find(`.Tag[@tag='${GameTag.BOARD_VISUAL_STATE}']`)?.get('value') || '0',
				),
			} as any;
		}
		if (
			element.tag === 'FullEntity' ||
			element.tag === 'ShowEntity' ||
			element.tag === 'ChangeEntity' ||
			element.tag === 'Player'
		) {
			const entityId = element.get('id') || element.get('entity');
			const cardIdChanges = structure.entities[entityId]?.cardIdChanges ?? [];
			structure.entities[entityId] = {
				entityId: parseInt(entityId),
				cardId: element.get('cardID'),
				playerId: element.get('playerID') ? +element.get('playerID') : undefined,
				controller: parseInt(element.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') || '-1'),
				creatorEntityId: parseInt(element.find(`.Tag[@tag='${GameTag.CREATOR}']`)?.get('value') || '0'),
				zone: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE}']`)?.get('value') || '-1'),
				zonePosition: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE_POSITION}']`)?.get('value') || '-1'),
				cardType: parseInt(element.find(`.Tag[@tag='${GameTag.CARDTYPE}']`)?.get('value') || '-1'),
				tribe: parseInt(element.find(`.Tag[@tag='${GameTag.CARDRACE}']`)?.get('value') || '-1'),
				atk: parseInt(element.find(`.Tag[@tag='${GameTag.ATK}']`)?.get('value') || '0'),
				health: parseInt(element.find(`.Tag[@tag='${GameTag.HEALTH}']`)?.get('value') || '0'),
				techLevel: parseInt(element.find(`.Tag[@tag='${GameTag.TECH_LEVEL}']`)?.get('value') || '0'),
				hasBeenReborn: parseInt(element.find(`.Tag[@tag='${GameTag.HAS_BEEN_REBORN}']`)?.get('value') || '0'),
				boardVisualState: parseInt(
					element.find(`.Tag[@tag='${GameTag.BOARD_VISUAL_STATE}']`)?.get('value') || '0',
				),
				summonedInCombat: structure.entities[structure.gameEntityId].boardVisualState === 2,
				cardIdChanges: cardIdChanges,
			};
			structure.entities[entityId].cardIdChanges.push({
				cardId: element.get('cardID'),
				turn: structure.currentTurn,
			});
			const debug = element.tag === 'ChangeEntity';
			const debug2 = 2;
		}
		if (structure.entities[element.get('entity')]) {
			if (parseInt(element.get('tag')) === GameTag.CONTROLLER) {
				structure.entities[element.get('entity')].controller = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.CREATOR) {
				structure.entities[element.get('entity')].creatorEntityId = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE) {
				structure.entities[element.get('entity')].zone = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE_POSITION) {
				structure.entities[element.get('entity')].zonePosition = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ATK) {
				// ATK.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].atk = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.HEALTH) {
				structure.entities[element.get('entity')].health = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.TECH_LEVEL) {
				structure.entities[element.get('entity')].techLevel = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.HAS_BEEN_REBORN) {
				structure.entities[element.get('entity')].hasBeenReborn = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.BOARD_VISUAL_STATE) {
				structure.entities[element.get('entity')].boardVisualState = parseInt(element.get('value'));
			}
		}
	};
};

const parseElement = (
	element: Element,
	mainPlayerId: number,
	opponentPlayerEntityId: string,
	parent: Element,
	structure: ParsingStructure,
	parseFunctions: readonly ((element: Element) => void)[],
	populateFunctions: readonly ((currentTurn: number) => void)[],
) => {
	parseFunctions.forEach((parseFunction) => parseFunction(element));
	if (element.tag === 'TagChange') {
		if (parseInt(element.get('tag')) === GameTag.TURN) {
			const playerEntityId = +element.get('entity');
			const playerEntity = structure.entities[playerEntityId];
			if (!!playerEntity?.playerId) {
				structure.currentTurns = structure.currentTurns ?? {};
				structure.currentTurns[playerEntity.playerId] = parseInt(element.get('value'));
			}
		}

		if (
			parseInt(element.get('tag')) === GameTag.NEXT_STEP &&
			parseInt(element.get('value')) === Step.MAIN_START_TRIGGERS
		) {
			if (parent && parent.get('entity') === opponentPlayerEntityId) {
				populateFunctions.forEach((populateFunction) => populateFunction(structure.currentTurn));
				structure.currentTurn++;
			}
		}
		if (
			parseInt(element.get('tag')) === GameTag.PLAYSTATE &&
			[PlayState.WON, PlayState.LOST].indexOf(parseInt(element.get('value'))) !== -1
		) {
			if (element.get('entity') === opponentPlayerEntityId) {
				populateFunctions.forEach((populateFunction) => populateFunction(structure.currentTurn));
				structure.currentTurn++;
			}
		}
	}

	const children = element.getchildren();
	if (children && children.length > 0) {
		for (const child of children) {
			parseElement(
				child,
				mainPlayerId,
				opponentPlayerEntityId,
				element,
				structure,
				parseFunctions,
				populateFunctions,
			);
		}
	}
};

export interface ParsingStructure {
	entities: {
		[entityId: number]: ParsingEntity;
	};
	gameEntityId: number;
	currentTurn: number;
	currentTurns: { [playerEntityId: number]: number };
	parsers: readonly Parser[];
}

export interface ParsingEntity {
	entityId: number;
	cardId: string;
	cardIdChanges?: { cardId: string; turn: number }[];
	playerId?: number;
	controller: number;
	creatorEntityId: number;
	zone: number;
	zonePosition: number;
	cardType: number;
	tribe: number;
	atk: number;
	health: number;
	techLevel: number;
	hasBeenReborn: number;
	boardVisualState: number;
	summonedInCombat: boolean;
}

export const getEntityCardId = (entity: ParsingEntity, currentTurn: number) => {
	const cardIdChanges = entity?.cardIdChanges;
	if (!cardIdChanges) {
		return entity?.cardId;
	}
	// Take the last one
	return [...cardIdChanges].reverse().find((change) => change.turn <= currentTurn)?.cardId ?? entity.cardId;
};

export interface Parser {
	parse: (structure: ParsingStructure) => (element: Element) => void;
	populate: (structure: ParsingStructure) => (currentTurn: number) => void;
}

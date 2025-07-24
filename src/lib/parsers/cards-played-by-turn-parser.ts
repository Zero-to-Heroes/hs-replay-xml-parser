/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { getEntityCardId, Parser, ParsingEntity, ParsingStructure } from '../generic-game-parser';

const entityIdToDebug = 241;

export class CardsPlayedByTurnParser implements Parser {
	public cardsPlayedByTurn: { [playedId: string]: CardPlayedByTurn[] } = {};
	// Includes cards played by effects
	public cardsCastByTurn: { [playedId: string]: CardPlayedByTurn[] } = {};

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			this.parsePlay(structure, element);
			this.parseCast(structure, element);
			this.parseCastTagChange(structure, element);
		};
	};

	parsePlay = (structure: ParsingStructure, element: Element) => {
		const isBlockPlay = element.tag === 'Block' && parseInt(element.get('type')!) === BlockType.PLAY;
		if (!isBlockPlay) {
			return;
		}

		const debug = +element.get('entity') == entityIdToDebug;
		const entity: ParsingEntity = structure.entities[element.get('entity')!];
		const controller = entity?.controller;
		if (!controller || controller === -1) {
			return;
		}

		// This happens with Thrall's hero power for instance
		if (entity.zone === Zone.PLAY) {
			return;
		}

		let cardsPlayedByPlayer = this.cardsPlayedByTurn[controller];
		if (!cardsPlayedByPlayer) {
			cardsPlayedByPlayer = [];
			this.cardsPlayedByTurn[controller] = cardsPlayedByPlayer;
		}

		const turn = structure.currentTurns[controller];
		let cardId = getEntityCardId(entity, turn) ?? element.get('cardID')!;
		if (!cardId) {
			cardId =
				element.find(`.//ShowEntity[@entity='${entity.entityId}']`)?.get('cardID') ??
				element.find(`.//FullEntity[@id='${entity.entityId}']`)?.get('cardID');
		}
		if (!cardId) {
			return;
		}

		let creatorEntityId = entity.creatorEntityId;
		if (
			!!element.find(`.//ShowEntity[@entity='${entity.entityId}']`) ||
			!!element.find(`.//FullEntity[@id='${entity.entityId}']`)
		) {
			const entityElement =
				element.find(`.//ShowEntity[@entity='${entity.entityId}']`) ||
				element.find(`.//FullEntity[@id='${entity.entityId}']`);
			const creatorTag = entityElement.find(`.//Tag[@tag="${GameTag.CREATOR}"]`)?.get('value');
			creatorEntityId = creatorEntityId || parseInt(creatorTag);
		}

		const cardPlayed = {
			cardId: cardId,
			turn: turn,
			entityId: entity.entityId,
			createdBy:
				creatorEntityId && !isNaN(creatorEntityId)
					? getEntityCardId(structure.entities[creatorEntityId], turn)
					: null,
		};
		cardsPlayedByPlayer.push(cardPlayed);
	};

	parseCast = (structure: ParsingStructure, element: Element) => {
		const isBlockTrigger =
			element.tag === 'Block' &&
			(parseInt(element.get('type')!) === BlockType.TRIGGER ||
				parseInt(element.get('type')!) === BlockType.POWER);
		if (!isBlockTrigger) {
			return;
		}

		const entity: ParsingEntity = structure.entities[element.get('entity')!];
		const controller = entity?.controller;
		if (!controller || controller === -1) {
			return;
		}

		const turn = structure.currentTurns[controller];

		const showEntities = element.findall('.//ShowEntity');
		const fullEntities = element.findall('.//FullEntity');
		const allEntities = [...showEntities, ...fullEntities];
		for (const ent of allEntities) {
			const controller = +ent.find(`.//Tag[@tag="${GameTag.CONTROLLER}"]`)?.get('value');
			if (!controller || isNaN(controller) || controller === -1) {
				continue;
			}

			const zone = +ent.find(`.//Tag[@tag="${GameTag.ZONE}"]`)?.get('value');
			if (zone !== Zone.PLAY && zone !== Zone.SECRET) {
				continue;
			}

			let cardsCastByPlayer = this.cardsCastByTurn[controller];
			if (!cardsCastByPlayer) {
				cardsCastByPlayer = [];
				this.cardsCastByTurn[controller] = cardsCastByPlayer;
			}

			const cardId = ent.get('cardID');
			if (!cardId) {
				continue;
			}

			const creatorEntityId = +ent.find(`.//Tag[@tag="${GameTag.CREATOR}"]`)?.get('value');
			const entityId = +ent.get('entity') || +ent.get('id');
			const debug = +entityId == entityIdToDebug;
			const creatorEntity = structure.entities[creatorEntityId];

			const cardPlayed = {
				cardId: cardId,
				turn: turn,
				entityId: entityId,
				createdBy:
					creatorEntityId && !isNaN(creatorEntityId)
						? getEntityCardId(structure.entities[creatorEntityId], turn) ?? null
						: null,
			};
			cardsCastByPlayer.push(cardPlayed);
		}
	};

	parseCastTagChange = (structure: ParsingStructure, element: Element) => {
		const isZoneChange = element.tag === 'TagChange' && parseInt(element.get('tag')!) === GameTag.ZONE;
		if (!isZoneChange) {
			return;
		}

		const zone = +element.get('value');
		if (zone !== Zone.PLAY && zone !== Zone.SECRET) {
			return;
		}

		const entity: ParsingEntity = structure.entities[element.get('entity')!];
		if (entity.cardType === CardType.ENCHANTMENT) {
			return;
		}

		const controller = entity?.controller;
		if (!controller || controller === -1) {
			return;
		}

		let cardsCastByPlayer = this.cardsCastByTurn[controller];
		if (!cardsCastByPlayer) {
			cardsCastByPlayer = [];
			this.cardsCastByTurn[controller] = cardsCastByPlayer;
		}

		const turn = structure.currentTurns[controller];
		const cardId = getEntityCardId(entity, turn) ?? element.get('cardID')!;
		if (!cardId) {
			return;
		}

		const creatorEntityId = entity.creatorEntityId;
		const debug = +entity.entityId == entityIdToDebug;
		const creatorEntity = structure.entities[creatorEntityId];

		const cardPlayed = {
			cardId: cardId,
			turn: turn,
			entityId: entity.entityId,
			createdBy: creatorEntityId && !isNaN(creatorEntityId) ? getEntityCardId(creatorEntity, turn) : null,
		};
		cardsCastByPlayer.push(cardPlayed);
	};

	populate = (structure: ParsingStructure) => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		return (currentTurn) => {};
	};
}

export interface CardPlayedByTurn {
	readonly cardId: string;
	readonly turn: number;
	readonly entityId: number;
	readonly createdBy: string | null;
}

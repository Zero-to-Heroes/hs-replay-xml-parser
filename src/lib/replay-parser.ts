import {
	AllCardsService,
	BnetRegion,
	CardIds,
	CardType,
	GameTag,
	GameType,
	PlayState,
	Zone,
} from '@firestone-hs/reference-data';
import bigInt from 'big-integer';
import { Element, parse } from 'elementtree';
import { extractAnomalies, extractHasBgsAnomalies } from './exrtactors/battlegrounds/anomalies-extractor';
import { heroPickExtractor } from './exrtactors/battlegrounds/hero-pick-extractor';
import { extractHasBgsQuests, extractHeroQuests } from './exrtactors/battlegrounds/quests-extractor';
import { Replay } from './model/replay';

const INNKEEPER_NAMES = [
	'The Innkeeper',
	'Aubergiste',
	'Gastwirt',
	'El tabernero',
	'Locandiere',
	'酒場のオヤジ',
	'여관주인',
	'Karczmarz',
	'O Estalajadeiro',
	'Хозяин таверны',
	'เจ้าของโรงแรม',
	'旅店老板',
	'旅店老闆',
];

export const buildReplayFromXml = (replayString: string, allCards: AllCardsService): Replay => {
	if (!replayString || replayString.length === 0) {
		console.log('no replay string');
		return null;
	}
	// http://effbot.org/zone/element-xpath.htm
	// http://effbot.org/zone/pythondoc-elementtree-ElementTree.htm
	const elementTree = parse(replayString);
	const allPlayerElements = elementTree.findall('.//Player');
	const allFullEntities = elementTree.findall('.//FullEntity');
	const allTagChanges = elementTree.findall('.//TagChange');
	const allChosenEntities = elementTree.findall(`.//ChosenEntities`);
	const allBlocks = elementTree.findall(`.//Block`);

	let mainPlayerElement = allPlayerElements.find((player) => player.get('isMainPlayer') === 'true');
	// Can happen in case of reconnects
	if (!mainPlayerElement) {
		// Find out known cards in hand, they must belong to the player
		for (const entity of allFullEntities) {
			const cardId = entity.get('cardID');
			const inHand = entity.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.HAND}']`);
			if (inHand && !!cardId) {
				const controllerId = entity.find(`.Tag[@tag='${GameTag.CONTROLLER}']`).get('value');
				mainPlayerElement = allPlayerElements.find((player) => player.get('playerID') === controllerId);
				break;
			}
		}
	}
	// Reconnect happened without any card in hand
	if (!mainPlayerElement) {
		// No idea how to handle this
	}
	if (!mainPlayerElement) {
		mainPlayerElement = allPlayerElements[0]; // Should never happen, but a fallback just in case
	}
	const mainPlayerId = parseInt(mainPlayerElement.get('playerID'));
	const mainPlayerName = mainPlayerElement.get('name');
	const mainPlayerEntityId = mainPlayerElement.get('id');
	// console.debug('main player', mainPlayerId, mainPlayerName, mainPlayerEntityId);
	const mainPlayerCardId = extractPlayerCardId(
		mainPlayerElement,
		mainPlayerEntityId,
		allFullEntities,
		allTagChanges,
		allCards,
	);
	const mainPlayerHeroPowerCardId = extractHeroPowerCardId(mainPlayerId, allFullEntities, allCards);

	const region: BnetRegion = bigInt(parseInt(mainPlayerElement.get('accountHi')))
		.shiftRight(32)
		.and(0xff)
		.toJSNumber();
	// console.log('mainPlayer');

	const opponentCandidates = allPlayerElements
		.filter((entity) => entity.get('isMainPlayer') == 'false')
		.filter((entity) => parseInt(entity.get('playerID')) !== mainPlayerId);
	const opponentPlayerElement = [...opponentCandidates].pop();
	const opponentPlayerId = parseInt(opponentPlayerElement.get('playerID'));
	const opponentPlayerEntityId = opponentPlayerElement.get('id');
	const opponentPlayerCardId = extractPlayerCardId(
		opponentPlayerElement,
		opponentPlayerEntityId,
		allFullEntities,
		allTagChanges,
		allCards,
	);
	const opponentPlayerHeroPowerCardId = extractHeroPowerCardId(opponentPlayerId, allFullEntities, allCards);

	// In short, this is a mess. When playing against a human, there are two players, one being an "AI" of sort,
	// and the other being the actual player
	const humanPlayerOpponentCandidates = opponentCandidates
		.filter((opponent) => opponent.get('name') !== 'UNKNOWN HUMAN PLAYER')
		.filter((opponent) => !INNKEEPER_NAMES.includes(opponent.get('name')));
	const opponentPlayerElementForName =
		opponentCandidates.length === 1
			? opponentCandidates[0]
			: humanPlayerOpponentCandidates.length > 0
			? humanPlayerOpponentCandidates[0]
			: [...opponentCandidates].pop();
	const opponentPlayerName = opponentPlayerElementForName.get('name');
	// console.log('opponentPlayerName', opponentPlayerName, mainPlayerElement, humanPlayerOpponentCandidates);
	// console.log('opponentPlayer');

	const gameFormat = parseInt(elementTree.find('Game').get('formatType'));
	const gameMode = parseInt(elementTree.find('Game').get('gameType'));
	const scenarioId = parseInt(elementTree.find('Game').get('scenarioID'));

	const result = extractResult(mainPlayerEntityId, allTagChanges);
	// console.log('result');
	const isBgGame = gameMode === GameType.GT_BATTLEGROUNDS || gameMode === GameType.GT_BATTLEGROUNDS_FRIENDLY;
	const additionalResult = isBgGame
		? '' + extractBgsAdditionalResult(mainPlayerId, allFullEntities, allTagChanges, allChosenEntities)
		: null;
	// console.log('bgsResult');
	const playCoin = extarctPlayCoin(mainPlayerEntityId, allTagChanges);

	// BG-specific stuff
	const hasBgsQuests = isBgGame ? extractHasBgsQuests(elementTree) : null;
	const bgsHeroQuests =
		isBgGame && hasBgsQuests
			? extractHeroQuests(allFullEntities, allChosenEntities, allTagChanges, allBlocks, mainPlayerId, allCards)
			: null;

	const hasBgsAnomalies = isBgGame ? extractHasBgsAnomalies(elementTree) : null;
	const anomalies = isBgGame && hasBgsAnomalies ? extractAnomalies(allFullEntities) : null;

	return Object.assign(new Replay(), {
		replay: elementTree,
		mainPlayerId: mainPlayerId,
		mainPlayerEntityId: +mainPlayerEntityId,
		mainPlayerName: mainPlayerName,
		mainPlayerCardId: mainPlayerCardId,
		mainPlayerHeroPowerCardId: mainPlayerHeroPowerCardId,
		opponentPlayerId: opponentPlayerId,
		opponentPlayerEntityId: +opponentPlayerEntityId,
		opponentPlayerName: opponentPlayerName,
		opponentPlayerCardId: opponentPlayerCardId,
		opponentPlayerHeroPowerCardId: opponentPlayerHeroPowerCardId,
		region: region,
		gameFormat: gameFormat,
		gameType: gameMode,
		scenarioId: scenarioId,
		result: result,
		additionalResult: additionalResult,
		playCoin: playCoin,
		hasBgsQuests: hasBgsQuests,
		bgsHeroQuests: bgsHeroQuests,
		hasBgsAnomalies: hasBgsAnomalies,
		bgsAnomalies: anomalies,
	} as Replay);
};

const extractPlayerCardId = (
	playerElement: Element,
	playerEntityId: string,
	allFullEntities: readonly Element[],
	allTagChanges: readonly Element[],
	allCards: AllCardsService = null,
): string => {
	const heroEntityId = playerElement.find(`.//Tag[@tag='${GameTag.HERO_ENTITY}']`)?.get('value');
	// Mercenaries don't have a hero entity id
	if (!heroEntityId) {
		return null;
	}
	const heroEntity = allFullEntities.find((e) => e.get('id') == `${heroEntityId}`);
	let cardId = heroEntity.get('cardID');
	// Battlegrounds assigns TB_BaconShop_HERO_PH at the start and then changes to the real hero
	if (cardId === 'TB_BaconShop_HERO_PH') {
		const tagChanges = allTagChanges
			.filter((tag) => tag.get('tag') === `${GameTag.HERO_ENTITY}`)
			.filter((tag) => tag.get('entity') === `${playerEntityId}`)
			.map((tag) => tag.get('value'));
		const pickedPlayedHero = tagChanges && tagChanges.length > 0 ? tagChanges[0] : null;
		const newHero = allFullEntities.filter((e) => e.get('id') == `${pickedPlayedHero}`)[0];
		if (!newHero) {
			console.warn('Could not identify hero from picks', pickedPlayedHero);
		} else {
			cardId = newHero.get('cardID');
		}
	}

	if (allCards) {
		// Handle Maestra
		const disguiseDbfId = allCards.getCard(CardIds.MaestraOfTheMasquerade_DisguiseEnchantment).dbfId;
		const heroControllerId = heroEntity.find(`.Tag[@tag='${GameTag.CONTROLLER}']`).get('value');
		const heroRevealed = allFullEntities
			.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO}']`))
			.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${heroControllerId}']`))
			.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CREATOR_DBID}'][@value='${disguiseDbfId}']`));
		if (heroRevealed.length > 0) {
			cardId = heroRevealed[heroRevealed.length - 1].get('cardID');
		}
		// else {
		// 	cardId = CardIds.ValeeraSanguinarHeroSkins;
		// }
	}

	return cardId;
};

const extractHeroPowerCardId = (
	playerId: number,
	allFullEntities: readonly Element[],
	allCards: AllCardsService = null,
): string => {
	const heroPowerElements = allFullEntities.filter(
		(e) =>
			e.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO_POWER}']`) &&
			e.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.PLAY}']`) &&
			e.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${playerId}']`),
	);
	// We want the starting hero power only
	const startingHeroPowerElement = heroPowerElements[0];
	// Mercenaries don't have a hero power
	if (!startingHeroPowerElement) {
		return null;
	}
	let cardId = startingHeroPowerElement.get('cardID');

	if (allCards) {
		// Handle Maestra
		const disguiseDbfId = allCards.getCard(CardIds.MaestraOfTheMasquerade_DisguiseEnchantment).dbfId;
		const heroRevealed = allFullEntities
			.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO_POWER}']`))
			.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${playerId}']`))
			.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CREATOR_DBID}'][@value='${disguiseDbfId}']`));
		if (heroRevealed.length > 0) {
			cardId = heroRevealed[heroRevealed.length - 1].get('cardID');
		}
	}

	return cardId;
};

const extractResult = (mainPlayerEntityId: string, allTagChanges: readonly Element[]): string => {
	const winChanges = allTagChanges
		.filter((e) => e.get('tag') === `${GameTag.PLAYSTATE}`)
		.filter((e) => e.get('value') === `${PlayState.WON}`);
	if (winChanges?.length) {
		// Because mercenaries introduce another player that mimics the main player, but with another
		// entity ID, we need to look at all the tags
		return winChanges.some((winChange) => mainPlayerEntityId === winChange.get('entity')) ? 'won' : 'lost';
	}

	const loseChanges = allTagChanges
		.filter((e) => e.get('tag') === `${GameTag.PLAYSTATE}`)
		.filter((e) => e.get('value') === `${PlayState.LOST}`);
	if (loseChanges?.length) {
		return loseChanges.some((winChange) => mainPlayerEntityId === winChange.get('entity')) ? 'lost' : 'won';
	}

	const tieChanges = allTagChanges
		.filter((e) => e.get('tag') === `${GameTag.PLAYSTATE}`)
		.filter((e) => e.get('value') === `${PlayState.TIED}`);
	if (tieChanges?.length) {
		return 'tied';
	}

	// For some reason when conceding (early?) in mercs, the WON state never shows up
	const winningChanges = allTagChanges
		.filter((e) => e.get('tag') === `${GameTag.PLAYSTATE}`)
		.filter((e) => e.get('value') === `${PlayState.WINNING}`);
	if (winningChanges?.length) {
		return winningChanges.some((winChange) => mainPlayerEntityId === winChange.get('entity')) ? 'won' : 'lost';
	}
	const losingChanges = allTagChanges
		.filter((e) => e.get('tag') === `${GameTag.PLAYSTATE}`)
		.filter((e) => e.get('value') === `${PlayState.LOSING}`);
	if (losingChanges?.length) {
		return losingChanges.some((winChange) => mainPlayerEntityId === winChange.get('entity')) ? 'lost' : 'won';
	}

	return 'unknown';
};

const extarctPlayCoin = (mainPlayerEntityId: string, allTagChanges: readonly Element[]): string => {
	const firstPlayerTags = allTagChanges
		.filter((e) => e.get('tag') === `${GameTag.FIRST_PLAYER}`)
		.filter((e) => e.get('value') === '1');
	return firstPlayerTags && firstPlayerTags.length > 0 && firstPlayerTags[0].get('entity') === mainPlayerEntityId
		? 'play'
		: 'coin';
};

const extractBgsAdditionalResult = (
	mainPlayerId: number,
	allFullEntities: readonly Element[],
	allTagChanges: readonly Element[],
	allChosenEntities: readonly Element[],
): number => {
	// console.log('mainPlayerId', mainPlayerId);
	const playerEntities = extractPlayerEntities(mainPlayerId, allFullEntities, allChosenEntities, true);
	// console.log('playerEntities', playerEntities);
	const entityIds = playerEntities.map((entity) => entity.get('id'));
	// console.log('player entity ids', entityIds);
	let leaderboardTags = allTagChanges
		.filter((tag) => tag.get('tag') === `${GameTag.PLAYER_LEADERBOARD_PLACE}`)
		.filter((tag) => entityIds.indexOf(tag.get('entity')) !== -1)
		.map((tag) => parseInt(tag.get('value')))
		.filter((value) => value > 0);
	// console.log('leaderboard tag changes', leaderboardTags);
	// No tag change, look at root tag
	if (!leaderboardTags || leaderboardTags.length === 0) {
		// console.log('no tag change, looking at root');
		leaderboardTags = playerEntities
			.map((entity) => entity.find(`.Tag[@tag='${GameTag.PLAYER_LEADERBOARD_PLACE}']`))
			.filter((tag) => tag)
			.map((tag) => parseInt(tag.get('value')))
			.filter((value) => value > 0);
		// console.log('leaderboard tag changes at root', leaderboardTags);
	}
	return !leaderboardTags || leaderboardTags.length === 0 ? 0 : leaderboardTags[leaderboardTags.length - 1];
};

export const extractPlayerEntities = (
	playerId: number,
	allFullEntities: readonly Element[],
	allChosenEntities: readonly Element[],
	isMainPlayer: boolean,
): Element[] => {
	const [pickOptions, pickedHeroFullEntity] = isMainPlayer
		? heroPickExtractor(allFullEntities, allChosenEntities, playerId)
		: [[], null];

	// The heroes that were discarded in the hero selection phase (if any)
	const invalidCardIds: readonly string[] = pickedHeroFullEntity
		? pickOptions
				.map((option) => option.get('cardID'))
				.filter((cardId) => cardId !== pickedHeroFullEntity.get('cardID'))
		: [];

	return allFullEntities
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${playerId}']`))
		.filter(
			(entity) =>
				!isMainPlayer ||
				![Zone.SETASIDE, Zone.GRAVEYARD].includes(
					parseInt(entity.find(`.Tag[@tag='${GameTag.ZONE}']`).get('value')),
				),
		)
		.filter((entity) => !invalidCardIds.includes(entity.get('cardID')))
		.filter(
			(entity) =>
				!['TB_BaconShop_HERO_PH', 'TB_BaconShop_HERO_KelThuzad', 'TB_BaconShopBob'].includes(
					entity.get('cardID'),
				),
		);
};

export const extractAllPlayerEntities = (
	mainPlayerId: number,
	opponentPlayerId: number,
	allFullEntities: readonly Element[],
	allChosenEntities: readonly Element[],
): Element[] => {
	const mainPlayerEntities = extractPlayerEntities(mainPlayerId, allFullEntities, allChosenEntities, true);
	const opponentEntities = extractPlayerEntities(opponentPlayerId, allFullEntities, allChosenEntities, false);
	return [...mainPlayerEntities, ...opponentEntities];
};

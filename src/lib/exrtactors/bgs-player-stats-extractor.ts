/* eslint-disable @typescript-eslint/no-use-before-define */
import { GameTag } from '@firestone-hs/reference-data';
import { Element, ElementTree } from 'elementtree';
import { PlayerStat } from '../model/player-stat';
import { extractAllPlayerEntities } from '../replay-parser';

export const extractBgsPlayerStats = (
	elementTree: ElementTree,
	mainPlayerId: number,
	opponentPlayerId: number,
): readonly PlayerStat[] => {
	const playerEntities = extractAllPlayerEntities(mainPlayerId, opponentPlayerId, elementTree);

	// Each player has one ID per match, so we need to aggregate all of them
	// It also inclues the choices during mulligan, which should be ok since they are not assigned any info
	const playerCardIds = [...new Set(playerEntities.map(entity => entity.get('cardID')))];
	// console.log(playerCardIds);

	const result: readonly PlayerStat[] = playerCardIds
		.map(cardId => buildPlayerStat(playerEntities, cardId, elementTree))
		.filter(stat => stat)
		.sort((a, b) => a.finalRank - b.finalRank);
	// console.log('result', result);
	if (result.length !== 8) {
		console.error('InvalidStatCount: ', result.length);
	}
	return result;
};

const buildPlayerStat = (playerEntities: readonly Element[], cardId: string, elementTree: ElementTree): PlayerStat => {
	const entities = playerEntities.filter(entity => entity.get('cardID') === cardId);
	const leaderboardValue = findLastValueOfTag(elementTree, entities, GameTag.PLAYER_LEADERBOARD_PLACE);
	// console.log(cardId, 'placed', cardId, leaderboardValue);
	if (!leaderboardValue) {
		return null;
	}
	const tavernUpgrades = findLastValueOfTag(elementTree, entities, GameTag.PLAYER_TECH_LEVEL);
	// console.log(cardId, 'tavernUpgrades', cardId, tavernUpgrades);
	return Object.assign(new PlayerStat(), {
		heroCardId: cardId,
		finalRank: leaderboardValue,
		tavernUpgrade: tavernUpgrades || 0,
	} as PlayerStat);
};

const findLastValueOfTag = (elementTree: ElementTree, entities: readonly Element[], tag: GameTag): number => {
	const entityIds = entities.map(entity => parseInt(entity.get('id') || entity.get('entity')));
	const tags = elementTree
		.findall(`.//TagChange[@tag='${tag}']`)
		.filter(tag => entityIds.indexOf(parseInt(tag.get('entity'))) !== -1)
		.map(tag => parseInt(tag.get('value')))
		// Not sure why sometimes it resets to 0
		.filter(value => value > 0);
	if (!tags || tags.length === 0) {
		const initialPositions = entities
			.map(entity => entity.find(`.//Tag[@tag='${tag}']`))
			.filter(tag => tag)
			.map(tag => parseInt(tag.get('value')))
			.filter(value => value > 0);
		return initialPositions && initialPositions.length > 0 ? initialPositions[initialPositions.length - 1] : null;
	}
	return tags[tags.length - 1];
};

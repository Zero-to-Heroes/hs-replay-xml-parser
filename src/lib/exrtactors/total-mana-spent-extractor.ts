import { GameTag } from '@firestone-hs/reference-data';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalManaSpentExtractor = (replay: Replay): PlayerOpponentValues => {
	const resourcesSpentChanges = replay.replay
		.findall(`.//TagChange[@tag='${GameTag.NUM_RESOURCES_SPENT_THIS_GAME}']`)
		.filter(tag => parseInt(tag.get('value')) !== 0);
	const mainPlayerEntityId = parseInt(replay.replay.find(`.//Player[@playerID='${replay.mainPlayerId}']`).get('id'));
	const playerResourcesSpentChanges = [...resourcesSpentChanges]
		.filter(tagChange => parseInt(tagChange.get('entity')) === mainPlayerEntityId)
		.map(tag => parseInt(tag.get('value')))
		.slice()
		.reverse()
		.find(total => total);
	const opponentResourcesSpentChanges = [...resourcesSpentChanges]
		.filter(tagChange => parseInt(tagChange.get('entity')) !== mainPlayerEntityId)
		.map(tag => parseInt(tag.get('value')))
		.slice()
		.reverse()
		.find(total => total);
	return {
		player: playerResourcesSpentChanges,
		opponent: opponentResourcesSpentChanges,
	};
};

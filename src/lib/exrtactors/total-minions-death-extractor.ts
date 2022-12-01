import { BlockType, GameTag, Zone } from '@firestone-hs/reference-data';
import { extractAllMinions } from '../global-info-extractor-internal';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalMinionsDeathExtractor = (replay: Replay): PlayerOpponentValues => {
	const allMinionEntities = extractAllMinions(replay);
	const opponentPlayerId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
			.get('playerID'),
	);

	const allDeadMinionEntityIds = replay.replay
		.findall(`.//Block[@type='${BlockType.DEATHS}']`)
		.map(block => block.findall(`.//TagChange[@tag='${GameTag.ZONE}']`))
		.reduce((a, b) => a.concat(b), [])
		.filter(tag => parseInt(tag.get('value')) === Zone.GRAVEYARD)
		.map(tag => parseInt(tag.get('entity')));
	const allDeadMinionEntities = allMinionEntities.filter(
		entity => allDeadMinionEntityIds.indexOf(parseInt(entity.get('entity') || entity.get('id'))) !== -1,
	);

	const controllerChanges = replay.replay.findall(`.//TagChange[@tag='${GameTag.CONTROLLER}']`);
	const allPlayedBlocks = replay.replay.findall(`.//Block[@type='${BlockType.PLAY}']`);
	// Then compare the index (_id) of each tag change to the tag change of the "play" action. If it's
	// earlier, we change the controller
	// TODO: it won't handle the case of: play a minion, then steal it, then back to hand, then replay it
	const idToController = {};
	for (const minion of allDeadMinionEntities) {
		const entityId = parseInt(minion.get('entity') || minion.get('id'));
		const controllerId = parseInt(minion.find(`.Tag[@tag='${GameTag.CONTROLLER}']`).get('value'));
		idToController[entityId] = controllerId;
	}

	for (const change of controllerChanges) {
		const entityId = parseInt(change.get('entity'));
		const changeIndex = change['_id'];
		const playBlock = allPlayedBlocks.find(block => parseInt(block.get('entity')) === entityId);
		if (!playBlock) {
			continue;
		}
		const playBlockIndex = playBlock['_id'];
		if (playBlockIndex > changeIndex) {
			idToController[entityId] = parseInt(change.get('value'));
		}
	}

	const playerDeadMinionEntityIds = [
		...new Set(
			allDeadMinionEntities.filter(
				entity => idToController[parseInt(entity.get('entity') || entity.get('id'))] === replay.mainPlayerId,
			),
		),
	];
	const opponentDeadMinionEntityIds = [
		...new Set(
			allDeadMinionEntities.filter(
				entity => idToController[parseInt(entity.get('entity') || entity.get('id'))] === opponentPlayerId,
			),
		),
	];
	// console.debug(allMinionEntities.find(entity => parseInt(entity.get('entity') || entity.get('id')) === 255));

	return { player: playerDeadMinionEntityIds.length, opponent: opponentDeadMinionEntityIds.length };
};

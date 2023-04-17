import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { extractAllCards } from '../global-info-extractor-internal';
import { PlayerOpponentElements } from '../model/player-opponent-elements';
import { Replay } from '../model/replay';

export const allCardsPlayedExtractor = (replay: Replay): PlayerOpponentElements => {
	// All the entities that are played
	// This works even for Battlegrounds, because even though new minions
	// with new entity ids are created for each round, only the first
	// time is a minion actually played
	const allPlayedBlocks = replay.replay.findall(`.//Block[@type='${BlockType.PLAY}']`);
	const allPlayBlockEntityIds = allPlayedBlocks.map(block => parseInt(block.get('entity')));
	// Now filter to keep only the minions
	const allCardEntities = extractAllCards(replay);
	const allPlayedCardEntities = allCardEntities.filter(
		entity => allPlayBlockEntityIds.indexOf(parseInt(entity.get('entity') || entity.get('id'))) !== -1,
	);
	// Now we want to associate a controller ID to each minion
	// Get all the TAG_CHANGE associated to these entities
	const controllerChanges = replay.replay.findall(`.//TagChange[@tag='${GameTag.CONTROLLER}']`);
	// Then compare the index (_id) of each tag change to the tag change of the "play" action. If it's
	// earlier, we change the controller
	// TODO: it won't handle the case of: play a minion, then steal it, then back to hand, then replay it
	const idToController = {};
	for (const minion of allPlayedCardEntities) {
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

	const playerCardEntities = allPlayedCardEntities.filter(
		minion => idToController[parseInt(minion.get('entity') || minion.get('id'))] === replay.mainPlayerId,
	);
	const opponentCardEntities = allPlayedCardEntities.filter(
		minion => idToController[parseInt(minion.get('entity') || minion.get('id'))] === replay.opponentPlayerId,
	);

	return { player: playerCardEntities, opponent: opponentCardEntities };
};

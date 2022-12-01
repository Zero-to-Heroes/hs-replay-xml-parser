import { GameTag } from '@firestone-hs/reference-data';
import { Replay } from './model/replay';

export const extractHeroEntityIds = (replay: Replay, playerId: number): readonly number[] => {
	const entityId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) === playerId)
			.get('id'),
	);

	// The entity can change
	const startingHeroEntityId: number = parseInt(
		replay.replay
			.find('.Game')
			.findall('.Player')
			.find(player => parseInt(player.get('playerID')) === playerId)
			.find(`.Tag[@tag='${GameTag.HERO_ENTITY}']`)
			.get('value'),
	);
	const otherHeroEntityIds: number[] = replay.replay
		.findall(`.//TagChange[@tag='${GameTag.HERO_ENTITY}'][@entity='${entityId}']`)
		.map(tag => parseInt(tag.get('value')));
	const heroEntityIds = [entityId, startingHeroEntityId, ...otherHeroEntityIds];
	return heroEntityIds;
};

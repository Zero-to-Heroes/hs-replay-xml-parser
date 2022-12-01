import { BlockType, GameTag, Zone } from '@firestone-hs/reference-data';
import { extractHeroEntityIds } from '../global-info-extractor';
import { Replay } from '../model/replay';

export const killedEnemeyHeroesExtarctor = (replay: Replay): number => {
	const opponentHeroEntityIds = extractHeroEntityIds(replay, replay.opponentPlayerId);
	// console.log('opponentHeroEntityIds', opponentHeroEntityIds);

	const killedEnemeyHeroElements = opponentHeroEntityIds
		.map(opponentHeroEntityId =>
			replay.replay
				.findall(`.//Block[@type='${BlockType.DEATHS}']`)
				.filter(
					block =>
						block.findall(
							`.//TagChange[@tag='${GameTag.ZONE}'][@value='${Zone.REMOVEDFROMGAME}'][@entity='${opponentHeroEntityId}']`,
						).length > 0,
				),
		)
		.reduce((a, b) => a.concat(b), [])
		.map(block => block.get('ts'));
	// console.log('killedEnemeyHeroElements', killedEnemeyHeroElements);
	const numberOfKilledEnemeyHeroes = killedEnemeyHeroElements.length;
	// console.log('numberOfKilledEnemeyHeroes', numberOfKilledEnemeyHeroes);
	return numberOfKilledEnemeyHeroes;
};

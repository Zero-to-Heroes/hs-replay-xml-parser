import { extractHeroEntityIds } from '../global-info-extractor';
import { PlayerOpponentValues } from '../model/player-opponent-values';
import { Replay } from '../model/replay';

export const totalDamageDealtToEnemyHeroExtractor = (replay: Replay): PlayerOpponentValues => {
	const damageToMainPlayer = buildDamageToPlayerId(replay, replay.mainPlayerId);
	const damageToOpponentPlayer = buildDamageToPlayerId(replay, replay.opponentPlayerId);
	return { player: damageToMainPlayer, opponent: damageToOpponentPlayer };
};

const buildDamageToPlayerId = (replay: Replay, playerId: number): number => {
	const heroEntityIds = extractHeroEntityIds(replay, playerId);
	const damageTags = replay.replay.findall(`.//MetaData[@meta='1']`);
	const damageToHero: number = damageTags
		.map(tag => {
			const infos = tag
				.findall(`.Info`)
				.filter(info => heroEntityIds.indexOf(parseInt(info.get('entity'))) !== -1);

			if (!infos || infos.length === 0) {
				return 0;
			}
			return parseInt(tag.get('data'));
		})
		.reduce((a, b) => a + b, 0);
	return damageToHero;
};

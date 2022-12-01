import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Replay } from './model/replay';

export const extractAllMinions = (replay: Replay): readonly Element[] => {
	const allMinionShowEntities = replay.replay
		.findall('.//ShowEntity')
		// Get only the entities that are of MINION type
		.filter(show => show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`));
	const allMinionFullEntities = replay.replay
		// Only the ones that have been revealed
		.findall('.//FullEntity[@cardID]')
		// Get only the entities that are of MINION type
		.filter(show => show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`));
	const allMinionEntities = [...allMinionShowEntities, ...allMinionFullEntities];
	return allMinionEntities;
};

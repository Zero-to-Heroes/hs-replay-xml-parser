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

export const extractAllCards = (replay: Replay): readonly Element[] => {
	const allMinionShowEntities = replay.replay
		.findall('.//ShowEntity')
		.filter(
			show =>
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`) ||
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.SPELL}']`) ||
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.LOCATION}']`) ||
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.WEAPON}']`),
		);
	const allMinionFullEntities = replay.replay
		// Only the ones that have been revealed
		.findall('.//FullEntity[@cardID]')
		.filter(
			show =>
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`) ||
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.SPELL}']`) ||
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.LOCATION}']`) ||
				show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.WEAPON}']`),
		);
	const allMinionEntities = [...allMinionShowEntities, ...allMinionFullEntities];
	return allMinionEntities;
};

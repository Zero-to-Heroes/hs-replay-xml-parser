import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';

export const extractHasBgsAnomalies = (elementTree: ElementTree): boolean => {
	return !!elementTree
		.find('.//GameEntity')
		.find(`.//Tag[@tag='${GameTag.BACON_GLOBAL_ANOMALY_DBID}']`)
		?.get('value');
};

export const extractAnomalies = (elementTree: ElementTree): readonly string[] => {
	return elementTree
		.findall(`.//FullEntity`)
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.BATTLEGROUND_ANOMALY}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.PLAY}']`))
		.map((e) => e.get('cardID'));
};

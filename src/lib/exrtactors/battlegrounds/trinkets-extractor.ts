import { AllCardsService, CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';
import { BgsHeroTrinket } from '../../model/replay';

export const extractHasBgsTrinkets = (elementTree: ElementTree): boolean => {
	return (
		elementTree.find('.//GameEntity').find(`.//Tag[@tag='${GameTag.BACON_TRINKETS_ACTIVE}']`)?.get('value') === '1'
	);
};

export const extractHeroTrinkets = (
	elementTree: ElementTree,
	mainPlayerId: number,
	playerHeroEntityId: number,
	allCards: AllCardsService,
): readonly BgsHeroTrinket[] => {
	let validCreatorDbIds = [CardIds.LesserTrinketToken_BG30_Trinket_1st, CardIds.GreaterTrinket_BG30_Trinket_2nd]
		.map((id) => allCards.getCard(id)?.dbfId)
		.filter((id) => !!id);
	if (!validCreatorDbIds.length) {
		// Hardcode while the patch is not officially released yet
		validCreatorDbIds = [116510, 116614];
	}
	const trinketOptions = elementTree
		.findall(`.//FullEntity`)
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.BATTLEGROUND_TRINKET}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${mainPlayerId}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.SETASIDE}']`))
		// filter the ones created by other trinkets or hero powers
		// It's not easy, because the "trinket space" is morphed into the new trinket once a trinket is picked
		// so it's the same creator entity id in both cases
		.filter((entity) => {
			const creatorDbfId = +(entity.find(`.Tag[@tag='${GameTag.CREATOR_DBID}']`)?.get('value') ?? 0);
			// console.debug('creatorDbfId', creatorDbfId, validCreatorDbIds);
			return validCreatorDbIds.includes(creatorDbfId);
		});

	// console.log('questOptions', questOptions, mainPlayerId);
	const trinketOptionIds = trinketOptions.map((option) => option?.get('id')) ?? [];
	// console.log('questOptionIds', questOptionIds);
	const pickedTrinkets = elementTree
		.findall(`.//ChosenEntities`)
		.filter((chosenEntities) => {
			const choice = chosenEntities.find('.//Choice');
			if (!choice) {
				console.warn('could not find trinket choice', JSON.stringify(chosenEntities));
				return false;
			}
			return trinketOptionIds.indexOf(choice?.get('entity')) !== -1;
		})
		.map((entity) => entity.find(`.//Choice`));
	// console.log('pickedQuest', pickedQuest);
	const pickedTrinketFullEntities = pickedTrinkets
		.map((t) => t.get('entity') ?? -1)
		.map((entityId) => trinketOptions.find((option) => option?.get('id') === entityId));

	const trinkets: BgsHeroTrinket[] = pickedTrinketFullEntities.map((pickedTrinketFullEntity) => {
		const result: BgsHeroTrinket = {
			cardId: pickedTrinketFullEntity?.get('cardID'),
			cost: +pickedTrinketFullEntity?.find(`.Tag[@tag='${GameTag.COST}']`)?.get('value'),
		};
		return result;
	});
	return trinkets;
};

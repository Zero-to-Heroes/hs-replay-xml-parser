import { AllCardsService, BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Element, ElementTree } from 'elementtree';
import { BgsHeroQuest } from '../../model/replay';

export const extractHasBgsQuests = (elementTree: ElementTree): boolean => {
	return (
		elementTree.find('.//GameEntity').find(`.//Tag[@tag='${GameTag.BACON_QUESTS_ACTIVE}']`)?.get('value') === '1'
	);
};

export const extractHeroQuests = (
	allFullEntities: readonly Element[],
	allChosenEntities: readonly Element[],
	allTagChanges: readonly Element[],
	allBlocks: readonly Element[],
	mainPlayerId: number,
	allCards: AllCardsService,
): readonly BgsHeroQuest[] => {
	// TODO: Sire D.
	const questOptions = allFullEntities
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.SPELL}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${mainPlayerId}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.SETASIDE}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.QUEST}'][@value='1']`));
	// console.log('questOptions', questOptions, mainPlayerId);
	const questOptionIds = questOptions.map((option) => option?.get('id')) ?? [];
	// console.log('questOptionIds', questOptionIds);
	const pickedQuest = allChosenEntities
		.filter((chosenEntities) => {
			const choice = chosenEntities.find('.//Choice');
			if (!choice) {
				console.warn('could not find choice', JSON.stringify(chosenEntities));
				return false;
			}
			return questOptionIds.indexOf(choice?.get('entity')) !== -1;
		})
		.map((entity) => entity.find(`.//Choice`));
	// console.log('pickedQuest', pickedQuest);
	const pickedQuestEntityId = pickedQuest[0]?.get('entity') ?? -1;
	console.log('pickedQuestEntityId', pickedQuestEntityId);
	const pickedQuestFullEntity = questOptions.find((option) => option?.get('id') === pickedQuestEntityId);
	// console.log('pickedQuestFullEntity', pickedQuestFullEntity);
	const questCardId = pickedQuestFullEntity?.get('cardID');
	if (!questCardId?.length) {
		return [];
	}
	const questDifficulty = +allTagChanges
		.filter((tagChange) => tagChange.get('entity') === pickedQuestEntityId)
		.filter((tagChange) => tagChange.get('tag') === `${GameTag.QUEST_PROGRESS_TOTAL}`)
		.map((tagChange) => tagChange.get('value'))
		.pop();
	console.log('questCardId=', questCardId, 'questDifficulty=', questDifficulty);

	const questRewardDbfId = +allTagChanges
		.filter((tagChange) => tagChange.get('entity') === pickedQuestEntityId)
		.filter((tagChange) => tagChange.get('tag') === `${GameTag.QUEST_REWARD_DATABASE_ID}`)
		.map((tagChange) => tagChange.get('value'))
		.pop();
	const questRewardCardId = allCards.getCardFromDbfId(questRewardDbfId).id;
	console.log('questRewardCardId=', questRewardCardId);

	const turnsCompletedElements = allTagChanges
		.filter((tagChange) => tagChange.get('entity') === pickedQuestEntityId)
		.filter((tagChange) => tagChange.get('tag') === `${GameTag.NUM_TURNS_IN_PLAY}`)
		.filter((tagChange) => tagChange.get('value') !== '0');
	console.log(
		'els',
		turnsCompletedElements.map((el) => el.get('value')),
	);
	const isCompleted = !!allBlocks.find(
		(block) =>
			block.get('type') === `${BlockType.TRIGGER}` &&
			block.get('entity') === pickedQuestEntityId &&
			block.get('cardId') === questCardId,
	);
	const turnsCompleted =
		isCompleted && turnsCompletedElements?.length
			? +turnsCompletedElements[turnsCompletedElements.length - 1]?.get('value')
			: null;

	// console.log('turnsCompleted=', turnsCompleted);
	// console.log('isCompleted=', isCompleted);
	return [
		{
			questCardId: questCardId,
			questDifficulty: questDifficulty,
			rewardCardId: questRewardCardId,
			turnCompleted: turnsCompleted,
			isCompleted: isCompleted,
		},
	];
};

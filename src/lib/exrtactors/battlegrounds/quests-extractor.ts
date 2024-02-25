import { AllCardsService, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';
import { BgsHeroQuest } from '../../model/replay';

export const extractHasBgsQuests = (elementTree: ElementTree): boolean => {
	return (
		elementTree.find('.//GameEntity').find(`.//Tag[@tag='${GameTag.BACON_QUESTS_ACTIVE}']`)?.get('value') === '1'
	);
};

export const extractHeroQuests = (
	elementTree: ElementTree,
	mainPlayerId: number,
	playerHeroEntityId: number,
	allCards: AllCardsService,
): readonly BgsHeroQuest[] => {
	// TODO: Sire D.
	const questOptions = elementTree
		.findall(`.//FullEntity`)
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.SPELL}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.CONTROLLER}'][@value='${mainPlayerId}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.ZONE}'][@value='${Zone.SETASIDE}']`))
		.filter((entity) => entity.find(`.Tag[@tag='${GameTag.QUEST}'][@value='1']`));
	// console.log('questOptions', questOptions, mainPlayerId);
	const questOptionIds = questOptions.map((option) => option?.get('id')) ?? [];
	// console.log('questOptionIds', questOptionIds);
	const pickedQuest = elementTree
		.findall(`.//ChosenEntities`)
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
	// console.log('mainPlayerId=', mainPlayerId);
	// console.log('playerHeroEntityId=', playerHeroEntityId);
	// console.log('pickedQuestEntityId', pickedQuestEntityId);
	const pickedQuestFullEntity = questOptions.find((option) => option?.get('id') === pickedQuestEntityId);
	// console.log('pickedQuestFullEntity', pickedQuestFullEntity);
	const questCardId = pickedQuestFullEntity?.get('cardID');
	if (!questCardId?.length) {
		return [];
	}
	const questDifficulty = elementTree
		.findall(`.//TagChange[@tag='${GameTag.QUEST_PROGRESS_TOTAL}'][@entity='${pickedQuestEntityId}']`)
		.filter((t) => t.get('value') != '0')
		.map((t) => +t.get('value'))[0];
	const questDifficultyMax = Math.max(
		...elementTree
			.findall(`.//TagChange[@tag='${GameTag.QUEST_PROGRESS_TOTAL}'][@entity='${pickedQuestEntityId}']`)
			.filter((t) => t.get('value') != '0')
			.map((t) => +t.get('value')),
	);
	const questDifficultyOld = +elementTree
		.findall(`.//TagChange[@tag='${GameTag.QUEST_PROGRESS_TOTAL}'][@entity='${pickedQuestEntityId}']`)
		.filter((t) => t.get('value') != '0')
		.pop()
		?.get('value');
	// console.log('questCardId=', questCardId, 'questDifficulty=', questDifficulty);
	// console.log(
	// 	'difficulties',
	// 	questOptions.map((option) => {
	// 		const allDifficulties = elementTree
	// 			.findall(`.//TagChange[@tag='${GameTag.QUEST_PROGRESS_TOTAL}'][@entity='${option.get('id')}']`)
	// 			.filter((t) => t.get('value') != '0');
	// 		console.debug(
	// 			'allDifficulties',
	// 			option.get('cardID'),
	// 			allDifficulties.map((t) => +t.get('value')),
	// 		);
	// 		const maxDifficulty = Math.max(...allDifficulties.map((t) => +t.get('value')));
	// 		const difficulty = +allDifficulties[0]?.get('value');
	// 		const difficultyOld = +[...allDifficulties].pop()?.get('value');
	// 		// console.debug('maxDifficulty', maxDifficulty, allDifficulties);
	// 		return {
	// 			id: option.get('id'),
	// 			cardId: option.get('cardID'),
	// 			difficulty: difficulty,
	// 			difficultyOld: difficultyOld,
	// 			maxDifficulty: maxDifficulty,
	// 		};
	// 	}),
	// );

	const questRewardDbfId = +elementTree
		.find(`.//TagChange[@tag='${GameTag.QUEST_REWARD_DATABASE_ID}'][@entity='${pickedQuestEntityId}']`)
		?.get('value');
	const questRewardCardId = allCards.getCardFromDbfId(questRewardDbfId).id;
	// console.log('questRewardCardId=', questRewardCardId);

	const turnsCompletedElements = elementTree
		.findall(`.//TagChange[@tag='${GameTag.NUM_TURNS_IN_PLAY}'][@entity='${pickedQuestEntityId}']`)
		.filter((el) => el.get('value') !== '0');
	// console.log(
	// 	'els',
	// 	turnsCompletedElements.map((el) => el.get('value')),
	// );
	// const isCompleted = !!elementTree.find(`.//Block[@type='${BlockType.TRIGGER}'][@entity='${pickedQuestEntityId}']`);
	const isCompleted = !!elementTree.find(
		`.//TagChange[@tag='${GameTag.BACON_QUEST_COMPLETED}'][@value='1'][@entity='${playerHeroEntityId}']`,
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
			questDifficultyMax: questDifficultyMax,
			questDifficultyOld: questDifficultyOld,
			rewardCardId: questRewardCardId,
			turnCompleted: turnsCompleted,
			isCompleted: isCompleted,
		} as any,
	];
};

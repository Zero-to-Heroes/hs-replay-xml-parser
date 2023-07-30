import { AllCardsService } from '@firestone-hs/reference-data';
import { parseHsReplayString } from '../xml-parser';
import { xml } from './bgs-quests.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	const replay = parseHsReplayString(xml, allCards);
	const mainPlayerCardId = replay.mainPlayerCardId;
	console.debug('mainPlayerCardId', mainPlayerCardId);
	// const parsed = parseBattlegroundsGame(xml, null, [], [], allCards);
	console.debug('parsed', replay.bgsHeroQuests);
	// const cardsPlayedParser = new ActivePlayerCardsPlayedParser(replay, allCards);
	// parseGame(replay, [cardsPlayedParser]);
	// console.debug('cards played by turn', cardsPlayedParser.entitiesPlayedPerTurn.toJS());
};

test();

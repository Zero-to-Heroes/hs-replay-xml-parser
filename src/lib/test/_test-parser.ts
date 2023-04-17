import { AllCardsService } from '@firestone-hs/reference-data';
import { parseGame } from '../generic-game-parser';
import { parseHsReplayString } from '../xml-parser';
import { ActivePlayerCardsPlayedParser } from './player-cards-played-parser';
import { xml } from './ranked.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	const replay = parseHsReplayString(xml, allCards);
	const cardsPlayedParser = new ActivePlayerCardsPlayedParser(replay, allCards);
	parseGame(replay, [cardsPlayedParser]);
	console.debug('cards played by turn', cardsPlayedParser.entitiesPlayedPerTurn.toJS());
};

test();

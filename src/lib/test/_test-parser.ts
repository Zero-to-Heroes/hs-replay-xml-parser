import { AllCardsService } from '@firestone-hs/reference-data';
import { parseGame } from '../generic-game-parser';
import { parseHsReplayString } from '../xml-parser';
import { xml } from './arena-dual-class';
// import { xml } from './bg-duos.xml';

const test = async () => {
	// const cardsStr = readFileSync('src/lib/test/cards_enUS.json').toString();
	// const allCards = new AllCardsLocalService(cardsStr);
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb(new Date().toISOString());
	let start = Date.now();

	const replay = parseHsReplayString(xml, allCards);
	// const parser = new CardsPlayedByTurnParser(allCards);
	parseGame(replay, []);
	console.debug('result', replay.result);
	console.debug('heroPowers', replay.mainPlayerHeroPowerCardId, replay.opponentPlayerHeroPowerCardId);
};

test().catch(console.error);

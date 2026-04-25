import { AllCardsService } from '@firestone-hs/reference-data';
import { parseGame } from '../generic-game-parser';
import { CardsPlayedByTurnParser } from '../parsers/cards-played-by-turn-parser';
import { parseHsReplayString } from '../xml-parser';
import { xml } from './player-summons.xml';
// import { xml } from './bg-duos.xml';

const test = async () => {
	// const cardsStr = readFileSync('src/lib/test/cards_enUS.json').toString();
	// const allCards = new AllCardsLocalService(cardsStr);
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb(new Date().toISOString());
	let start = Date.now();

	const replay = parseHsReplayString(xml, allCards);
	const parser = new CardsPlayedByTurnParser(allCards);
	parseGame(replay, [parser]);
	console.debug('result', replay.result);
	console.debug('cards played by turn', parser.cardsPlayedByTurn);
	console.debug('cards played by turn grouped by player',
		Object.keys(parser.cardsPlayedByTurn).map(playerId => ({ playerId, cards: parser.cardsPlayedByTurn[playerId].length })));
	console.debug('cards played by turn grouped by player',
		Object.keys(parser.cardsPlayedByTurn).map(playerId => ({ playerId, cards: parser.cardsPlayedByTurn[playerId].map(c => c.cardId) })));
	console.debug('cards cast by turn', parser.cardsCastByTurn);
	start = Date.now();
};

test().catch(console.error);

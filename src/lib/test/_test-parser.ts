import { AllCardsService } from '@firestone-hs/reference-data';
import { parseBattlegroundsGame, parseHsReplayString } from '../xml-parser';
import { xml } from './bg-reroll.xml';
// import { xml } from './bg-duos.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	let start = Date.now();

	const replay = parseHsReplayString(xml, allCards);
	console.log('mainPlayerCardId', replay.mainPlayerCardId);
	const bgGame = parseBattlegroundsGame(xml, null, null, null, allCards);
	console.log('heroesOffered', bgGame.heroesOffered);
	// const parser = new CardsPlayedByTurnParser();
	// parseGame(replay, [parser]);
	// console.debug('cards played by turn', parser.cardsPlayedByTurn);
	start = Date.now();
};

test();

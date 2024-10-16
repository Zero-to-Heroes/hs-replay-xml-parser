import { AllCardsService } from '@firestone-hs/reference-data';
import { parseBattlegroundsGame } from '../xml-parser';
import { xml } from './bg-game-trinkets.xml';
// import { xml } from './bg-duos.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	let start = Date.now();
	const bg = parseBattlegroundsGame(xml, null, [], [], allCards);
	console.debug('trinkets', bg.heroesOffered);
	start = Date.now();
};

test();

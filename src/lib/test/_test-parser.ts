import { AllCardsService } from '@firestone-hs/reference-data';
import { parseBattlegroundsGame, parseHsReplayString } from '../xml-parser';
import { xml } from './bg-game-trinkets.xml';
// import { xml } from './bg-duos.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	let start = Date.now();
	const replay = parseHsReplayString(xml, allCards);
	console.debug('parseHsReplayString after', Date.now() - start);
	start = Date.now();
	const bg = parseBattlegroundsGame(xml, null, [], [], allCards);
	console.debug('parseBattlegroundsGame after', Date.now() - start);
	console.debug('trinkets', replay.hasBgsTrinkets, replay.bgsHeroTrinkets);
	start = Date.now();
};

test();

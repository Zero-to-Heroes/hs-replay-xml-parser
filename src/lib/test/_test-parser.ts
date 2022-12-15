import { AllCardsService } from '@firestone-hs/reference-data';
import { parseBattlegroundsGame } from '../xml-parser';
import { xml } from './bg-game.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	const stats = parseBattlegroundsGame(xml, null, null, null, allCards);
	console.log('hpOverTurn', stats.hpOverTurn);
	// const replay = parseHsReplayString(xml, allCards);
	// console.log(
	// 	'replay',
	// 	replay.mainPlayerId,
	// 	replay.mainPlayerEntityId,
	// 	replay.result,
	// 	replay.mainPlayerName,
	// 	replay.mainPlayerHeroPowerCardId,
	// );
};
test();

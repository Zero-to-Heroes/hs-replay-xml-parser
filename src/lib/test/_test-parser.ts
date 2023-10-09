import { AllCardsService } from '@firestone-hs/reference-data';
import { parseHsReplayString } from '../xml-parser';
// import { xml } from './bgs-game-anomaly.xml';
import { xml } from './tie.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	const replay = parseHsReplayString(xml, allCards);
	console.debug('result', replay.result);
	// const bgs = parseBattlegroundsGame(xml, null, [], [], allCards);
	const mainPlayerCardId = replay.mainPlayerCardId;
	console.debug('mainPlayerCardId', mainPlayerCardId);
	// const parsed = parseBattlegroundsGame(xml, null, [], [], allCards);
	// console.debug('parsed', bgs.playerIdToCardIdMapping);
	// const cardsPlayedParser = new ActivePlayerCardsPlayedParser(replay, allCards);
	// parseGame(replay, [cardsPlayedParser]);
	// console.debug('cards played by turn', cardsPlayedParser.entitiesPlayedPerTurn.toJS());
};

test();

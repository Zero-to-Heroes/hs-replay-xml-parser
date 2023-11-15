import { AllCardsService } from '@firestone-hs/reference-data';
import { parseBattlegroundsGame, parseHsReplayString } from '../xml-parser';
// import { xml } from './bgs-game-anomaly.xml';
import { BgsPostMatchStats } from '../model/bgs-post-match-stats';
import { Replay } from '../model/replay';
import { xml } from './bg-perfect-game-one-tie.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	const replay = parseHsReplayString(xml, allCards);
	console.debug('result', replay.result);
	const bgParsedInfo = parseBattlegroundsGame(xml, null, [], [], allCards);
	const mainPlayerCardId = replay.mainPlayerCardId;
	console.debug('mainPlayerCardId', mainPlayerCardId);
	const bgPerfectGame = isBgPerfectGame(bgParsedInfo, replay);
	console.debug('bgPerfectGame', bgPerfectGame);
	// const parsed = parseBattlegroundsGame(xml, null, [], [], allCards);
	// console.debug('parsed', bgs.playerIdToCardIdMapping);
	// const cardsPlayedParser = new ActivePlayerCardsPlayedParser(replay, allCards);
	// parseGame(replay, [cardsPlayedParser]);
	// console.debug('cards played by turn', cardsPlayedParser.entitiesPlayedPerTurn.toJS());
};

test();

const isBgPerfectGame = (bgParsedInfo: BgsPostMatchStats, replay: Replay): boolean => {
	const mainPlayerHpOverTurn = bgParsedInfo.hpOverTurn[replay.mainPlayerId];
	console.debug('hpOverTurn', bgParsedInfo.hpOverTurn);
	console.debug('mainPlayerHpOverTurn', mainPlayerHpOverTurn);
	// Let's use 8 turns as a minimum to be considered a perfect game
	if (!mainPlayerHpOverTurn?.length || mainPlayerHpOverTurn.length < 8) {
		return false;
	}

	const maxHp = Math.max(...mainPlayerHpOverTurn.map((info) => info.value));
	const startingHp = maxHp;
	const endHp = mainPlayerHpOverTurn[mainPlayerHpOverTurn.length - 1].value;
	return endHp === startingHp;
};

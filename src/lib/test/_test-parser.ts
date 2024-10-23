import { AllCardsService, BlockType } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { parseGame, Parser, ParsingStructure } from '../generic-game-parser';
import { parseHsReplayString } from '../xml-parser';
import { xml } from './ranked.xml';
// import { xml } from './bg-duos.xml';

const test = async () => {
	const allCards = new AllCardsService();
	await allCards.initializeCardsDb();
	let start = Date.now();

	const replay = parseHsReplayString(xml, allCards);
	const parser = new CardsPlayedByTurnParser();
	parseGame(replay, [parser]);
	console.debug('cards played by turn', parser.cardsPlayedByTurn);
	start = Date.now();
};

test();

export class CardsPlayedByTurnParser implements Parser {
	public cardsPlayedByTurn: { [playedId: string]: any[] } = {};

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			const isBlockPlay = element.tag === 'Block' && parseInt(element.get('type')!) === BlockType.PLAY;
			if (!isBlockPlay) {
				return;
			}

			const entity = structure.entities[element.get('entity')!];
			const controller = entity?.controller;
			if (!controller) {
				return;
			}

			let cardsPlayedByPlayer = this.cardsPlayedByTurn[controller];
			if (!cardsPlayedByPlayer) {
				cardsPlayedByPlayer = [];
				this.cardsPlayedByTurn[controller] = cardsPlayedByPlayer;
			}
			const cardPlayed = {
				cardId: entity.cardId,
				turn: structure.currentTurn,
			};
			cardsPlayedByPlayer.push(cardPlayed);
		};
	};

	populate = (structure: ParsingStructure) => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		return (currentTurn) => {};
	};
}

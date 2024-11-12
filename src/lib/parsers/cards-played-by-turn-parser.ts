/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BlockType, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Parser, ParsingEntity, ParsingStructure } from '../generic-game-parser';

export class CardsPlayedByTurnParser implements Parser {
	public cardsPlayedByTurn: { [playedId: string]: CardPlayedByTurn[] } = {};

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			const isBlockPlay = element.tag === 'Block' && parseInt(element.get('type')!) === BlockType.PLAY;
			if (!isBlockPlay) {
				return;
			}

			const entity: ParsingEntity = structure.entities[element.get('entity')!];
			const controller = entity?.controller;
			if (!controller) {
				return;
			}

			// const controllerEntity = Object.values(structure.entities).find((e) => e.playerId === controller);
			// console.debug('controllerEntity', controllerEntity.entityId, controllerEntity.controller, controller);
			// if (!controllerEntity) {
			// 	return;
			// }

			// This happens with Thrall's hero power for instance
			if (entity.zone === Zone.PLAY) {
				return;
			}

			let cardsPlayedByPlayer = this.cardsPlayedByTurn[controller];
			if (!cardsPlayedByPlayer) {
				cardsPlayedByPlayer = [];
				this.cardsPlayedByTurn[controller] = cardsPlayedByPlayer;
			}
			let cardId = entity.cardId ?? element.get('cardID')!;
			if (!cardId) {
				cardId =
					element.find(`.//ShowEntity[@entity='${entity.entityId}']`)?.get('cardID') ??
					element.find(`.//FullEntity[@id='${entity.entityId}']`)?.get('cardID');
			}
			const turn = structure.currentTurns[controller];
			const cardPlayed = {
				cardId: cardId,
				turn: turn,
				entityId: entity.entityId,
				createdBy: entity.creatorEntityId ? structure.entities[entity.creatorEntityId]?.cardId : null,
			};
			cardsPlayedByPlayer.push(cardPlayed);
		};
	};

	populate = (structure: ParsingStructure) => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		return (currentTurn) => {};
	};
}

export interface CardPlayedByTurn {
	readonly cardId: string;
	readonly turn: number;
	readonly entityId: number;
	readonly createdBy: string | null;
}

import { AllCardsService, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Map } from 'immutable';
import { getEntityCardId, Parser, ParsingStructure } from '../generic-game-parser';
import { Replay } from '../model/replay';

export interface Card {
	id: number;
	inInitialDeck: boolean;
}

// Works only for the active player for now
export class ActivePlayerCardsPlayedParser implements Parser {
	entitiesPlayedThisTurn: Card[] = [];
	entitiesPlayedPerTurn: Map<number, readonly Card[]> = Map();

	constructor(private readonly replay: Replay, private readonly allCards: AllCardsService) {}

	parse = (structure: ParsingStructure) => {
		return (element: Element) => {
			if (element.tag !== 'TagChange') {
				return;
			}
			if (parseInt(element.get('tag')) !== GameTag.ZONE) {
				return;
			}
			if (parseInt(element.get('value')) !== Zone.PLAY) {
				return;
			}

			const entityId = parseInt(element.get('entity'));
			const existingEntity = structure.entities[entityId];
			if (
				// We're only interested in the cards the active player plays for now
				!existingEntity ||
				existingEntity.controller !== this.replay.mainPlayerId
			) {
				// console.debug('invalid entity', existingEntity?.controller, this.replay.mainPlayerId);
				return;
			}

			if (existingEntity.cardType === CardType.ENCHANTMENT) {
				return;
			}

			const cardId = getEntityCardId(existingEntity, structure.currentTurn);
			if (!this.allCards.getCard(cardId).dbfId) {
				console.warn('could not find id', cardId);

				if (!cardId) {
					console.warn('missing entity card Id', existingEntity);
				}
			}

			this.entitiesPlayedThisTurn.push({
				id: this.allCards.getCard(cardId).dbfId,
				inInitialDeck: !existingEntity.creatorEntityId,
			});
			// console.debug('this.entitiesPlayedThisTurn', this.entitiesPlayedThisTurn);
		};
	};

	populate = (structure: ParsingStructure) => {
		return (currentTurn) => {
			this.entitiesPlayedPerTurn = this.entitiesPlayedPerTurn.set(currentTurn, this.entitiesPlayedThisTurn);
			this.entitiesPlayedThisTurn = [];
		};
	};
}

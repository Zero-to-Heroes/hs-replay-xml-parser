import { Element } from 'elementtree';

export interface PlayerOpponentElements {
	readonly player: readonly Element[];
	readonly opponent: readonly Element[];
}

import { BnetRegion, GameFormat, GameType } from '@firestone-hs/reference-data';
import { ElementTree } from 'elementtree';

export class Replay {
	readonly replay: ElementTree;
	readonly mainPlayerId: number;
	readonly mainPlayerEntityId: number;
	readonly mainPlayerName: string;
	readonly mainPlayerCardId: string;
	readonly mainPlayerHeroPowerCardId: string;
	readonly opponentPlayerId: number;
	readonly opponentPlayerEntityId: number;
	readonly opponentPlayerName: string;
	readonly opponentPlayerCardId: string;
	readonly opponentPlayerHeroPowerCardId: string;
	readonly region: BnetRegion;
	readonly gameFormat: GameFormat;
	readonly gameType: GameType;
	readonly scenarioId: number;
	readonly result: 'won' | 'lost' | 'tied';
	readonly additionalResult: string;
	readonly playCoin: 'play' | 'coin';
	readonly hasBgsQuests: boolean;
	readonly bgsHeroQuests: readonly BgsHeroQuest[];
	readonly hasBgsTrinkets: boolean;
	readonly bgsHeroTrinkets: readonly BgsHeroTrinket[];
	readonly bgsHeroTrinketsOffered: readonly string[];
	readonly hasBgsAnomalies: boolean;
	readonly bgsAnomalies: readonly string[];
}

export interface BgsHeroQuest {
	readonly questCardId: string;
	readonly questDifficulty: number;
	readonly rewardCardId: string;
	readonly isCompleted: boolean;
	readonly turnCompleted: number;
}

export interface BgsHeroTrinket {
	readonly cardId: string;
	readonly cost: number;
}

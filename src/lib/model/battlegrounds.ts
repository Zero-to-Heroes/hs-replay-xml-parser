import { Map } from 'immutable';

export interface BattleResultHistory {
	readonly turn: number;
	readonly simulationResult: BgsBattleSimulationResult;
	readonly actualResult: string;
}

export interface BgsBattleSimulationResult {
	won: number;
	tied: number;
	lost: number;
	damageWon: number;
	damageLost: number;
	wonPercent: number;
	tiedPercent: number;
	lostPercent: number;
	averageDamageWon: number;
	averageDamageLost: number;
}

export interface BgsTavernUpgrade {
	readonly turn: number;
	readonly tavernTier: number;
}

export interface BgsTriple {
	readonly turn: number;
	readonly tierOfTripledMinion: number;
	readonly cardId?: string;
}

export interface BgsBoard {
	readonly turn: number;
	readonly board: readonly Entity[];
}

export interface BgsPlayer {
	readonly cardId: string;
	readonly heroPowerCardId: string;
	readonly name: string;
	readonly isMainPlayer: boolean;
	readonly tavernUpgradeHistory: readonly BgsTavernUpgrade[];
	readonly tripleHistory: readonly BgsTriple[];
	readonly compositionHistory: readonly BgsComposition[];
	readonly boardHistory: readonly BgsBoard[];
	readonly initialHealth: number;
	readonly damageTaken: number;
	readonly leaderboardPlace: number;
	readonly currentWinStreak: number;
	readonly highestWinStreak: number;
}

export interface BgsComposition {
	readonly turn: number;
	readonly tribe: string;
	readonly count: number;
}

export interface Entity {
	readonly id: number;
	readonly cardID: string;
	readonly damageForThisAction: number;
	readonly tags: Map<string, number>;
}

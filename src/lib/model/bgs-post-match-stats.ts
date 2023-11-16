import { BattleResultHistory, BgsBoard, BgsComposition, BgsTavernUpgrade, BgsTriple } from './battlegrounds';
import { BgsFaceOff } from './bgs-face-off';
import { BooleanTurnInfo } from './boolean-turn-info';
import { ComplexTurnInfo } from './complex-turn-info';
import { NumericTurnInfo } from './numeric-turn-info';
import { ValueHeroInfo } from './value-hero-info';

export interface BgsPostMatchStats {
	readonly tavernTimings: readonly BgsTavernUpgrade[];
	readonly tripleTimings: readonly BgsTriple[];
	readonly rerolls: number;
	readonly highestWinStreak: number;

	readonly replayLink: string;

	readonly playerIdToCardIdMapping: { [playerId: string]: string };

	readonly boardHistory: readonly BgsBoard[];
	readonly compositionsOverTurn: readonly BgsComposition[];
	readonly rerollsOverTurn: readonly NumericTurnInfo[];
	readonly freezesOverTurn: readonly NumericTurnInfo[];
	readonly coinsWastedOverTurn: readonly NumericTurnInfo[];
	readonly mainPlayerHeroPowersOverTurn: readonly NumericTurnInfo[];
	readonly hpOverTurn: { [playerId: string]: readonly NumericTurnInfo[] };
	readonly leaderboardPositionOverTurn: { [playerId: string]: readonly NumericTurnInfo[] };
	readonly totalStatsOverTurn: readonly NumericTurnInfo[];
	readonly wentFirstInBattleOverTurn: readonly BooleanTurnInfo[];
	readonly damageToEnemyHeroOverTurn: readonly ComplexTurnInfo<ValueHeroInfo>[];

	readonly minionsBoughtOverTurn: readonly NumericTurnInfo[];
	readonly minionsSoldOverTurn: readonly NumericTurnInfo[];

	readonly totalMinionsDamageDealt: { [cardId: string]: number };
	readonly totalMinionsDamageTaken: { [cardId: string]: number };

	readonly totalEnemyMinionsKilled: number;
	readonly totalEnemyHeroesKilled: number;
	readonly luckFactor: number;
	readonly battleResultHistory: readonly BattleResultHistory[];
	readonly faceOffs: readonly BgsFaceOff[];
}

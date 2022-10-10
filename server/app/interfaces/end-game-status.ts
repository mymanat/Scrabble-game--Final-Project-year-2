import { Player } from '@app/classes/game/player';

export interface EndGameStatus {
    players: { player: Player; opponent: Player };
    remainingLetters: number;
    winner: string | null;
}

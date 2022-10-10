import { Player } from '@app/classes/game/player';
import { EndGameStatus } from '@app/interfaces/end-game-status';

export class GameFinishStatus {
    constructor(public players: Player[], public remainingLetters: number, public winner: string | null) {}

    toEndGameStatus(playerIndex: number): EndGameStatus {
        return {
            players: { player: this.players[playerIndex], opponent: this.players[(playerIndex + 1) % 2] },
            remainingLetters: this.remainingLetters,
            winner: this.winner,
        };
    }
}

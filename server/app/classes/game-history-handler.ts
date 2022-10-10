import { Player } from '@app/classes/game/player';
import { SECONDS_IN_MINUTE } from 'common/constants';
import { GameHistory } from 'common/interfaces/game-history';
import { GameMode } from 'common/interfaces/game-mode';
import { MILLISECONDS_PER_SEC } from './game/game';

export class GameHistoryHandler {
    private startDate: Date;
    constructor() {
        this.startDate = new Date();
    }

    createGameHistoryData(players: Player[], isSurrender: boolean, gameMode: GameMode): GameHistory {
        const gameDuration = this.timerToString(Math.round((Date.now() - this.startDate.getTime()) / MILLISECONDS_PER_SEC));
        const history: GameHistory = {
            date: this.startDate.toLocaleString('fr-CA', { timeZone: 'America/New_York' }),
            gameDuration,
            namePlayer1: players[0].name,
            scorePlayer1: players[0].score,
            namePlayer2: players[1].name,
            scorePlayer2: players[1].score,
            gameMode,
            isSurrender,
        };
        return history;
    }

    timerToString(time: number): string {
        if (time >= SECONDS_IN_MINUTE) {
            return `${Math.floor(time / SECONDS_IN_MINUTE)} min ${(time % SECONDS_IN_MINUTE).toString()} sec`;
        } else {
            return `${time.toString()} sec`;
        }
    }
}

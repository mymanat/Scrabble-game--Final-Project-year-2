import { GameMode } from 'common/interfaces/game-mode';
import { DEFAULT_TIMER } from '../constants';

export class GameOptions {
    constructor(public hostname: string, public dictionaryType: string, public gameMode: GameMode, public timePerRound: number = DEFAULT_TIMER) {}
}

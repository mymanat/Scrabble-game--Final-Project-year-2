import { GameError, GameErrorType } from '@app/classes/game.exception';
import { Letter } from 'common/classes/letter';

export class Player {
    easel: Letter[];
    score: number;

    constructor(public name: string) {
        this.easel = [];
        this.score = 0;
    }

    canRemoveLetters(letters: Letter[]): boolean {
        let returnValue = true;
        const playerTempEasel = [...this.easel];
        // validation
        letters.forEach((l) => {
            const index = playerTempEasel.indexOf(l);
            if (index < 0) returnValue = false;
            playerTempEasel.splice(index, 1);
        });
        return returnValue;
    }

    removeLetters(letters: Letter[]): GameError | undefined {
        if (!this.canRemoveLetters(letters)) return new GameError(GameErrorType.LettersAreNotInEasel);

        // execution
        letters.forEach((l) => {
            this.easel.splice(
                this.easel.findIndex((letter) => letter === l),
                1,
            );
        });
        return;
    }

    addLetters(letters: Letter[]): void {
        letters.forEach((l) => this.easel.push(l));
    }
}

import { Component, ElementRef, HostListener } from '@angular/core';
import { exchangeLetters, switchLettersEasel } from '@app/actions/player.actions';
import { BoardState } from '@app/reducers/board.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { KeyManagerService } from '@app/services/key-manager.service';
import { Store } from '@ngrx/store';
import { Letter, stringToLetter } from 'common/classes/letter';
import { EASEL_CAPACITY, POSITION_LAST_CHAR } from 'common/constants';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-easel',
    templateUrl: './easel.component.html',
    styleUrls: ['./easel.component.scss'],
})
export class EaselComponent {
    readonly manipulationNotInArray = POSITION_LAST_CHAR;
    readonly mainColor = '#fffcec';
    readonly exchangeColor = 'red';
    readonly manipulationColor = 'url(#rainbowGradient)';
    easel: Letter[];
    pointsPerLetter$: Observable<Map<Letter, number>>;
    letterColor: string[];

    constructor(
        private store: Store<{ board: BoardState; players: Players; gameStatus: GameStatus }>,
        private eRef: ElementRef,
        private keyManager: KeyManagerService,
    ) {
        this.pointsPerLetter$ = store.select('board', 'pointsPerLetter');
        store.select('players').subscribe((players) => {
            this.easel = players.player.easel;
        });
        this.letterColor = new Array(EASEL_CAPACITY).fill(this.mainColor);
    }
    @HostListener('window:mousewheel', ['$event'])
    mouseWheelEvent(event: WheelEvent): void {
        if (event.deltaY > 0) {
            this.handlePositionSwitch(true);
        } else if (event.deltaY < 0) {
            this.handlePositionSwitch(false);
        }
    }

    @HostListener('keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key === 'ArrowRight') {
            this.handlePositionSwitch(true);
        } else if (event.key === 'ArrowLeft') {
            this.handlePositionSwitch(false);
        } else {
            this.selectLetterWithKey(event.key);
        }
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (this.eRef.nativeElement.contains(event.target)) this.keyManager.onEsc();
    }

    handlePositionSwitch(moveRight: boolean) {
        const manipulatedLetterIndex = this.letterColor.indexOf(this.manipulationColor);
        if (manipulatedLetterIndex === this.manipulationNotInArray) return;
        let nextPosition;
        if (moveRight) nextPosition = manipulatedLetterIndex === this.easel.length - 1 ? 0 : manipulatedLetterIndex + 1;
        else nextPosition = manipulatedLetterIndex === 0 ? this.easel.length - 1 : manipulatedLetterIndex - 1;
        this.store.dispatch(switchLettersEasel({ positionIndex: manipulatedLetterIndex, destinationIndex: nextPosition }));
        this.switchColorPosition(manipulatedLetterIndex, nextPosition);
    }

    selectLetterWithKey(keyEvent: string) {
        if (keyEvent.length !== 1 || !this.easel.includes(stringToLetter(keyEvent))) {
            this.cancelSelection();
            return;
        }
        const keyPressed = keyEvent.toUpperCase() as Letter;
        const firstIndexLetter = this.easel.indexOf(keyPressed);
        let manipulationIndex = this.letterColor.indexOf(this.manipulationColor);
        if (manipulationIndex < 0) manipulationIndex = this.easel.length - 1;
        this.cancelSelection();
        if (this.easel[manipulationIndex] !== stringToLetter(keyEvent)) {
            this.letterColor[firstIndexLetter] = this.manipulationColor;
        } else {
            const nextIndex = this.easel.indexOf(keyPressed, manipulationIndex + 1);
            const nextIndexNotFound = -1;
            if (nextIndex === nextIndexNotFound) {
                this.letterColor[firstIndexLetter] = this.manipulationColor;
            } else {
                this.letterColor[nextIndex] = this.manipulationColor;
            }
        }
    }

    switchColorPosition(positionIndex: number, destinationIndex: number) {
        const tempColor = this.letterColor[positionIndex];
        this.letterColor[positionIndex] = this.letterColor[destinationIndex];
        this.letterColor[destinationIndex] = tempColor;
    }

    cancelSelection(): void {
        this.cancelExchangeSelection();
        this.cancelManipulationSelection();
    }

    gameIsEnded(): boolean {
        let gameEnded = false;
        this.store.select('gameStatus').subscribe((status) => {
            gameEnded = status.gameEnded;
        });
        if (gameEnded) {
            this.cancelSelection();
        }
        return gameEnded;
    }

    selectLetterToSwitch(event: MouseEvent, letterIndex: number): void {
        event.preventDefault();
        if (this.gameIsEnded()) return;
        const color = this.letterColor[letterIndex];
        if (color === this.exchangeColor) {
            this.letterColor[letterIndex] = this.mainColor;
        } else {
            this.letterColor[letterIndex] = this.exchangeColor;
            this.cancelManipulationSelection();
        }
    }

    disableExchange(): boolean {
        const minLettersForExchange = 7;
        let activePlayer;
        let playerUsername;
        let lettersInPot = 0;
        this.store.select('gameStatus').subscribe((status) => {
            activePlayer = status.activePlayer;
            lettersInPot = status.letterPotLength;
        });
        this.store.select('players').subscribe((players) => {
            playerUsername = players.player.name;
        });
        let gameEnded;
        this.store.select('gameStatus').subscribe((status) => {
            gameEnded = status.gameEnded;
        });
        return !(activePlayer === playerUsername && minLettersForExchange <= lettersInPot && !gameEnded);
    }

    exchangeLetterSelected(): boolean {
        return this.letterColor.includes(this.exchangeColor);
    }

    exchangeSelectedLetters(): void {
        let lettersToExchange = '';
        for (let index = 0; index < this.easel.length; index++) {
            if (this.letterColor[index] === this.exchangeColor) {
                lettersToExchange += this.easel[index].toLowerCase();
            }
        }
        this.store.dispatch(exchangeLetters({ letters: lettersToExchange }));
        this.cancelExchangeSelection();
    }

    cancelExchangeSelection(): void {
        this.letterColor.forEach((color, index) => {
            if (color === this.exchangeColor) this.letterColor[index] = this.mainColor;
        });
    }

    cancelManipulationSelection(): void {
        const indexManipulationLetter = this.letterColor.indexOf(this.manipulationColor);
        if (indexManipulationLetter !== this.manipulationNotInArray) this.letterColor[indexManipulationLetter] = this.mainColor;
    }

    selectLetterForManipulation(letterIndex: number): void {
        if (this.gameIsEnded() || this.letterColor[letterIndex] === this.exchangeColor) return;
        this.cancelSelection();
        this.letterColor[letterIndex] = this.manipulationColor;
    }
}

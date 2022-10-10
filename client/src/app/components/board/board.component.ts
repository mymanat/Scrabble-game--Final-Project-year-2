import { Component, HostListener } from '@angular/core';
import { BoardState } from '@app/reducers/board.reducer';
import { LocalSettings } from '@app/reducers/local-settings.reducer';
import { KeyManagerService } from '@app/services/key-manager.service';
import { Store } from '@ngrx/store';
import { Letter } from 'common/classes/letter';
import { Multiplier, MultiplierType } from 'common/classes/multiplier';
import { BOARD_SIZE } from 'common/constants';
import { Observable } from 'rxjs';

const LETTER_A = 'A'.charCodeAt(0);

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
})
export class BoardComponent {
    readonly multiplierType = MultiplierType;
    readonly boardSize = BOARD_SIZE;

    boardState$: Observable<BoardState>;
    pointsPerLetter$: Observable<Map<Letter, number>>;
    multipliers$: Observable<(Multiplier | null)[][]>;
    localSettings$: Observable<LocalSettings>;

    constructor(store: Store<{ board: BoardState; localSettings: LocalSettings }>, private keyManager: KeyManagerService) {
        this.boardState$ = store.select('board');
        this.pointsPerLetter$ = store.select('board', 'pointsPerLetter');
        this.multipliers$ = store.select('board', 'multipliers');
        this.localSettings$ = store.select('localSettings');
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(e: KeyboardEvent): void {
        this.keyManager.onKey(e.key);
    }

    numberSequence(n: number): number[] {
        return Array(n)
            .fill(0)
            .map((x, i) => i + 1);
    }

    letterSequence(n: number): string[] {
        return Array(n)
            .fill(0)
            .map((x, i) => String.fromCharCode(LETTER_A + i));
    }
}

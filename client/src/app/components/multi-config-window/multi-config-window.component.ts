import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { loadDictionaries } from '@app/actions/dictionaries.actions';
import { resetAllState } from '@app/actions/game-status.actions';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@app/constants';
import { RoomService } from '@app/services/room.service';
import { Store } from '@ngrx/store';
import { GameOptions } from 'common/classes/game-options';
import { DEFAULT_TIMER, SECONDS_IN_MINUTE } from 'common/constants';
import { iDictionary } from 'common/interfaces/dictionary';
import { GameMode } from 'common/interfaces/game-mode';
import { Observable } from 'rxjs';

export const MAX_TIME = 300;
export const MIN_TIME = 30;
export const TIMER_INCREMENT = 30;

@Component({
    selector: 'app-multi-config-window',
    templateUrl: './multi-config-window.component.html',
    styleUrls: ['./multi-config-window.component.scss'],
})
export class MultiConfigWindowComponent implements OnInit {
    @Input() isSoloGame: boolean;
    @Output() gameOptionsSubmitted: EventEmitter<{ gameOptions: GameOptions; botLevel?: string }>;
    settingsForm: FormGroup;
    dictionaries$: Observable<iDictionary[]>;
    gameMode$: Observable<GameMode>;
    timer: number;
    readonly minNameLength: number = MIN_NAME_LENGTH;
    readonly maxNameLength: number = MAX_NAME_LENGTH;
    readonly maxTime: number = MAX_TIME;
    readonly minTime: number = MIN_TIME;
    readonly defaultTimer: number = DEFAULT_TIMER;
    readonly timerIncrement: number = TIMER_INCREMENT;

    constructor(
        private fb: FormBuilder,
        public roomService: RoomService,
        dictionariesStore: Store<{ dictionaries: iDictionary[] }>,
        store: Store<{ gameMode: GameMode }>,
    ) {
        this.gameOptionsSubmitted = new EventEmitter();
        store.dispatch(resetAllState());
        this.timer = this.defaultTimer;
        this.dictionaries$ = dictionariesStore.select('dictionaries');
        store.dispatch(loadDictionaries());
        this.gameMode$ = store.select('gameMode');
    }

    ngOnInit(): void {
        this.settingsForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(this.minNameLength), Validators.maxLength(this.maxNameLength)]],
            botLevel: ['Débutant'],
            selectedDictionary: ['Francais', Validators.required],
        });
    }

    incrementTime(): void {
        if (this.timer < this.maxTime) this.timer += this.timerIncrement;
    }

    decrementTime(): void {
        if (this.timer > this.minTime) this.timer -= this.timerIncrement;
    }

    onSubmit(): void {
        let decidedGameMode = GameMode.Classical;
        this.gameMode$.subscribe((gameMode) => (decidedGameMode = gameMode));
        const gameOptions = new GameOptions(
            this.settingsForm.controls.name.value,
            this.settingsForm.controls.selectedDictionary.value,
            decidedGameMode,
            this.timer,
        );
        if (this.isSoloGame) this.gameOptionsSubmitted.emit({ gameOptions, botLevel: this.settingsForm.controls.botLevel.value });
        else this.gameOptionsSubmitted.emit({ gameOptions });
    }

    timerToString(): string {
        if (this.timer === MIN_TIME) {
            return `${Math.floor(this.timer / SECONDS_IN_MINUTE)}:${(this.timer % SECONDS_IN_MINUTE).toString().padStart(2, '0')} sec`;
        } else {
            return `${Math.floor(this.timer / SECONDS_IN_MINUTE)}:${(this.timer % SECONDS_IN_MINUTE).toString().padStart(2, '0')} min`;
        }
    }
}

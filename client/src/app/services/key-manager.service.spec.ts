/* eslint-disable dot-notation */
import { TestBed } from '@angular/core/testing';
import { removeLetterFromEasel } from '@app/actions/player.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { Direction } from '@app/enums/direction';
import { createEmptyMatrix } from '@app/reducers/board.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Letter } from 'common/classes/letter';
import { iVec2, Vec2 } from 'common/classes/vec2';
import { BOARD_SIZE } from 'common/constants';
import { cold } from 'jasmine-marbles';
import { KeyManagerService } from './key-manager.service';
import { PlayerService } from './player.service';

describe('KeyManagerService', () => {
    let service: KeyManagerService;
    let store: MockStore;
    let boardStub: Letter[][];
    let selectionStub: BoardSelection;

    beforeEach(async () => {
        boardStub = createEmptyMatrix({ x: BOARD_SIZE, y: BOARD_SIZE });
        boardStub[0][0] = 'L';
        boardStub[1][0] = 'E';
        selectionStub = new BoardSelection(new Vec2(2, 0), Direction.HORIZONTAL, [new Vec2(0, 0), new Vec2(1, 0)]);
        await TestBed.configureTestingModule({
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'board',
                            value: {
                                board: boardStub,
                                selection: selectionStub,
                                blanks: [],
                            },
                        },
                    ],
                }),
                {
                    provide: PlayerService,
                    useValue: {
                        getEasel: () => {
                            return ['A', 'B', '*'];
                        },
                    },
                },
            ],
        }).compileComponents();
        service = TestBed.inject(KeyManagerService);
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('KeyManager.onKey', () => {
        it("onKey shouldn't do anything if the board selection cell is null", () => {
            store.overrideSelector('board', { selection: new BoardSelection() });
            service['board$'] = store.select('board');
            const dispatchSpy = spyOn(store, 'dispatch');

            service.onKey('a');
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('onKey should the right method if receiving Enter, Escape or Backspace', () => {
            const enterSpy = spyOn(service, 'onEnter');
            service.onKey('Enter');
            expect(enterSpy).toHaveBeenCalled();

            const escSpy = spyOn(service, 'onEsc');
            service.onKey('Escape');
            expect(escSpy).toHaveBeenCalled();

            const backspaceSpy = spyOn(service, 'onBackspace');
            service.onKey('Backspace');
            expect(backspaceSpy).toHaveBeenCalled();
        });

        it("onKey shouldn't do anything if receiving a key longer than 1 char that isn't enter, escape of backspace", () => {
            const dispatchSpy = spyOn(store, 'dispatch');

            service.onKey('Shift');
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it("onKey shouldn't do anything if receiving a key that is a number or star", () => {
            const dispatchSpy = spyOn(store, 'dispatch');

            service.onKey('2');
            service.onKey('*');
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it("onKey shouldn't do anything the focus is on something else than the body", () => {
            const testButton = document.createElement('button');
            document.body.appendChild(testButton);
            testButton.focus();
            const dispatchSpy = spyOn(store, 'dispatch');
            service.onKey('a');
            expect(dispatchSpy).not.toHaveBeenCalled();
            document.body.removeChild(testButton);
            document.body.focus();
        });

        it("onKey shouldn't do anything if the selection is filed with a letter and is at board limit", () => {
            const customBoard = createEmptyMatrix({ x: BOARD_SIZE, y: BOARD_SIZE });
            customBoard[BOARD_SIZE - 1][0] = 'a';

            store.overrideSelector('board', {
                board: customBoard,
                selection: new BoardSelection(new Vec2(BOARD_SIZE - 1, 0), Direction.HORIZONTAL, [new Vec2(BOARD_SIZE - 1, 0)]),
            });
            service['board$'] = store.select('board');

            const dispatchSpy = spyOn(store, 'dispatch');

            service.onKey('a');
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it("onKey shouldn't do anything if the letter is not in the player easel", () => {
            const dispatchSpy = spyOn(store, 'dispatch');

            service.onKey('z');
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('onKey should dispatch placeLetter and removeLetterFromEasel', () => {
            service.onKey('a');

            const expectedAction = cold('a', { a: removeLetterFromEasel({ letter: 'A' }) });

            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('onKey should convert letters with accent to their counterpart without accents', () => {
            service.onKey('à');

            const expectedAction = cold('a', { a: removeLetterFromEasel({ letter: 'A' }) });

            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('onKey should convert letters with accent to their counterpart without accents', () => {
            service.onKey('à');

            const expectedAction = cold('a', { a: removeLetterFromEasel({ letter: 'A' }) });

            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('onKey should add the blank to the service blank list', () => {
            service.onKey('G');

            const expectedAction = cold('a', { a: removeLetterFromEasel({ letter: '*' }) });

            expect(store.scannedActions$).toBeObservable(expectedAction);
        });
    });

    describe('KeyManager.onEnter, onEsc and onBackspace', () => {
        let actions: { type: string }[];
        let dispatchSpy: jasmine.Spy;

        beforeEach(() => {
            actions = [];
            dispatchSpy = spyOn(store, 'dispatch').and.callFake((action) => {
                actions.push(action);
            });
        });

        it('onEnter should dispatch addLettersToEasel, removeLetters, placeWord and clearSelection', () => {
            service.onEnter();

            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(dispatchSpy).toHaveBeenCalledTimes(4);

            const addLettersToEaselAction = actions[0] as unknown as { type: string; letters: Letter[] };
            expect(addLettersToEaselAction.type).toEqual('[Players] Add Letters To Easel');
            expect(addLettersToEaselAction.letters).toEqual(['L', 'E']);

            const removeLetterAction = actions[1] as unknown as { type: string; positions: Vec2[] };
            expect(removeLetterAction.type).toEqual('[Board] Letters Removed');
            expect(removeLetterAction.positions).toEqual([new Vec2(0, 0), new Vec2(1, 0)]);

            const placeWordAction = actions[2] as unknown as { type: string; position: string; letters: string };
            expect(placeWordAction.type).toEqual('[Players] Place Word');
            expect(placeWordAction.position).toEqual('a1h');
            expect(placeWordAction.letters).toEqual('le');

            expect(actions[3].type).toEqual('[Board] Selection Cleared');
        });

        it('onEnter should set the orientation depending on the modified cells position', () => {
            // Horizontal
            selectionStub.orientation = null;

            service.onEnter();

            let placeWordAction = actions[2] as unknown as { type: string; position: string; letters: string };
            expect(placeWordAction.position).toEqual('a1h');

            // Vertical
            actions = [];
            selectionStub.orientation = null;
            selectionStub.modifiedCells = [new Vec2(0, 0), new Vec2(0, 1)];

            service.onEnter();

            placeWordAction = actions[2] as unknown as { type: string; position: string; letters: string };
            expect(placeWordAction.position).toEqual('a1v');

            // Vertical
            actions = [];
            selectionStub.orientation = null;
            selectionStub.modifiedCells = [new Vec2(0, 0)];
            store.overrideSelector('board', { board: boardStub, selection: selectionStub, blanks: [] });

            service.onEnter();

            placeWordAction = actions[2] as unknown as { type: string; position: string; letters: string };
            expect(placeWordAction.position).toEqual('a1');
        });

        it('onEnter should set blank letters in capital when place word action is called', () => {
            store.overrideSelector('board', { board: boardStub, selection: selectionStub, blanks: [new Vec2(1, 0)] });
            service['board$'] = store.select('board');
            service.onEnter();

            const addLettersToEaselAction = actions[0] as unknown as { type: string; letters: Letter[] };
            expect(addLettersToEaselAction.letters).toEqual(['L', '*']);

            const placeWordAction = actions[2] as unknown as { type: string; position: string; letters: string };
            expect(placeWordAction.letters).toEqual('lE');
        });

        it('onEnter should set blank letters in capital when place word action is called', () => {
            selectionStub.modifiedCells = [];
            service.onEnter();

            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('onEsc should dispatch addLettersToEasel, removeLetters and clearSelection', () => {
            service.onEsc();

            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(dispatchSpy).toHaveBeenCalledTimes(3);

            const addLettersToEaselAction = actions[0] as unknown as { type: string; letters: Letter[] };
            expect(addLettersToEaselAction.type).toEqual('[Players] Add Letters To Easel');
            expect(addLettersToEaselAction.letters).toEqual(['L', 'E']);

            const removeLetterAction = actions[1] as unknown as { type: string; positions: iVec2[] };
            expect(removeLetterAction.type).toEqual('[Board] Letters Removed');
            expect(removeLetterAction.positions).toEqual([new Vec2(0, 0), new Vec2(1, 0)]);

            expect(actions[2].type).toEqual('[Board] Selection Cleared');
        });

        it('onEsc should dispatch addLettersToEasel with a blank letter with a blank was placed', () => {
            store.overrideSelector('board', { board: boardStub, selection: selectionStub, blanks: [new Vec2(1, 0)] });
            service['board$'] = store.select('board');

            service.onEsc();

            const addLettersToEaselAction = actions[0] as unknown as { type: string; letters: Letter[] };
            expect(addLettersToEaselAction.letters).toEqual(['L', '*']);
        });

        it('onBackspace should dispatch addLettersToEasel and backspaceSelection', () => {
            service.onBackspace();

            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(dispatchSpy).toHaveBeenCalledTimes(2);

            const addLettersToEaselAction = actions[0] as unknown as { type: string; letters: Letter[] };
            expect(addLettersToEaselAction.type).toEqual('[Players] Add Letters To Easel');
            expect(addLettersToEaselAction.letters).toEqual(['E']);

            expect(actions[1].type).toEqual('[Board] Selection Backspace');
        });

        it("onBackspace shouldn't dispatch anything if there are no modifiedCells", () => {
            selectionStub.modifiedCells = [];
            service.onBackspace();

            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('onBackspace should dispatch addLettersToEasel with a blank letter with a blank was placed', () => {
            store.overrideSelector('board', { board: boardStub, selection: selectionStub, blanks: [new Vec2(1, 0)] });
            service['board$'] = store.select('board');

            service.onBackspace();

            const addLettersToEaselAction = actions[0] as unknown as { type: string; letters: Letter[] };
            expect(addLettersToEaselAction.letters).toEqual(['*']);
        });
    });
});

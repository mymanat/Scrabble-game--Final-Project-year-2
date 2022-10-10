import { gameStatusReceived, resetAllState } from '@app/actions/game-status.actions';
import { addLettersToEasel, exchangeLettersSuccess, placeWordSuccess, removeLetterFromEasel, switchLettersEasel } from '@app/actions/player.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { Player } from '@app/classes/player';
import { Word } from '@app/classes/word';
import { Direction } from '@app/enums/direction';
import { Letter } from 'common/classes/letter';
import { Vec2 } from 'common/classes/vec2';
import { BoardState } from './board.reducer';
import { GameStatus } from './game-status.reducer';
import { initialState, Players, reducer } from './player.reducer';

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function createInitialPlayersState() {
    const players: Players = {
        player: new Player('Player 1'),
        opponent: new Player('Player 2'),
        botLevel: 'Débutant',
    };

    players.player.easel = ['A', 'S', 'S', 'L', 'L', 'P', 'O'];
    players.player.score = 0;

    return players;
}

describe('[Players] Reducer', () => {
    describe('[Players] Load Players', () => {
        const playersStub: Players = {
            player: new Player('Player 1'),
            opponent: new Player('Player 2'),
            botLevel: 'Débutant',
        };

        const gameStatusStub: GameStatus = {
            activePlayer: '',
            winner: null,
            gameEnded: false,
            letterPotLength: 0,
            timer: 0,
        };

        const boardState: BoardState = {
            board: [],
            multipliers: [],
            pointsPerLetter: new Map(),
            blanks: [],
            lastPlacedWord: [],
            selection: new BoardSelection(),
        };

        it('should return the loaded players', () => {
            const action = gameStatusReceived({
                status: gameStatusStub,
                players: playersStub,
                board: boardState,
            });

            const result = reducer(initialState, action);

            expect(result).toBe(playersStub);
        });
    });

    describe('[Players] Place Word Success', () => {
        const word = new Word('allo', new Vec2(0, 0), Direction.VERTICAL);

        it('should remove used letters and add new letters to easel', () => {
            const initialPlayers: Players = createInitialPlayersState();
            const newLetters: Letter[] = ['G', 'H', 'B', 'L'];
            const action = placeWordSuccess({ word, newLetters });

            const result = reducer(initialPlayers, action);

            const expectedResult = createInitialPlayersState();
            expectedResult.player.removeLettersFromEasel(['A', 'L', 'L', 'O']);
            expectedResult.player.addLettersToEasel(newLetters);

            expect(result).toEqual(expectedResult);
        });

        it('should set the new score', () => {
            const initialPlayers: Players = createInitialPlayersState();
            const newScore = 100;
            const action = placeWordSuccess({ word, newScore });

            const result = reducer(initialPlayers, action);

            const expectedResult = createInitialPlayersState();
            expectedResult.player.removeLettersFromEasel(['A', 'L', 'L', 'O']);
            expectedResult.player.score = newScore;

            expect(result).toEqual(expectedResult);
        });
    });

    describe('[Players] Remove Letter From Easel', () => {
        it('should remove letter from easel', () => {
            const letterToRemove: Letter = 'A';

            const initialPlayers: Players = createInitialPlayersState();
            const action = removeLetterFromEasel({ letter: letterToRemove });

            const result = reducer(initialPlayers, action);

            const expectedResult = createInitialPlayersState();
            expectedResult.player.removeLettersFromEasel([letterToRemove]);

            expect(result).toEqual(expectedResult);
        });
    });

    describe('[Players] Add Letters To Easel', () => {
        it('should add letters to easel', () => {
            const lettersToAdd: Letter[] = ['A', 'H'];

            const initialPlayers: Players = createInitialPlayersState();
            initialPlayers.player.easel = [];
            const action = addLettersToEasel({ letters: lettersToAdd });

            const result = reducer(initialPlayers, action);

            const expectedResult = initialPlayers;
            expectedResult.player.addLettersToEasel(lettersToAdd);

            expect(result).toEqual(expectedResult);
        });
    });

    describe('[Players] Exchange Letters Success', () => {
        it('should exchange the chosen letters', () => {
            const lettersToExchange: Letter[] = ['P', 'S'];
            const newLetters: Letter[] = ['A', 'E'];

            const initialPlayers: Players = createInitialPlayersState();
            const action = exchangeLettersSuccess({ oldLetters: lettersToExchange, newLetters });

            const result = reducer(initialPlayers, action);

            const expectedResult = createInitialPlayersState();
            expectedResult.player.removeLettersFromEasel(lettersToExchange);
            expectedResult.player.addLettersToEasel(newLetters);

            expect(result).toEqual(expectedResult);
        });
    });

    describe('[Players] Switch Letters Easel', () => {
        it('should exchange the letters in the easel', () => {
            const action = switchLettersEasel({ positionIndex: 0, destinationIndex: 1 });
            const expectedResult = ['S', 'A', 'S', 'L', 'L', 'P', 'O'] as Letter[];
            const result = reducer(createInitialPlayersState(), action);
            expect(result.player.easel).toEqual(expectedResult);
        });
    });

    it('should reset to initial state', () => {
        const action = resetAllState();
        const result = reducer(createInitialPlayersState(), action);

        expect(result).toEqual(initialState);
    });
});

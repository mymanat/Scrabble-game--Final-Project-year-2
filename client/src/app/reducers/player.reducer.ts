import { gameStatusReceived, resetAllState } from '@app/actions/game-status.actions';
import { addLettersToEasel, exchangeLettersSuccess, placeWordSuccess, removeLetterFromEasel, switchLettersEasel } from '@app/actions/player.actions';
import { copyPlayer, Player } from '@app/classes/player';
import { createReducer, on } from '@ngrx/store';
import { stringToLetters } from 'common/classes/letter';

export const playerFeatureKey = 'players';

export interface Players {
    player: Player;
    opponent: Player;
    botLevel?: string;
}

export const initialState: Players = {
    player: new Player(''),
    opponent: new Player(''),
};

export const reducer = createReducer(
    initialState,

    on(gameStatusReceived, (state, { players }) => players),

    on(placeWordSuccess, (state, { word, newLetters, newScore }) => {
        const nextState = { player: copyPlayer(state.player), opponent: copyPlayer(state.opponent), botLevel: state.botLevel };
        nextState.player.removeLettersFromEasel(stringToLetters(word.letters));

        if (newLetters) nextState.player.addLettersToEasel(newLetters);
        if (newScore) nextState.player.score = newScore;

        return nextState;
    }),

    on(exchangeLettersSuccess, (state, { oldLetters, newLetters }) => {
        const nextState = { player: copyPlayer(state.player), opponent: copyPlayer(state.opponent), botLevel: state.botLevel };
        nextState.player.removeLettersFromEasel(oldLetters);
        nextState.player.addLettersToEasel(newLetters);

        return nextState;
    }),

    on(removeLetterFromEasel, (state, { letter }) => {
        const nextState = { player: copyPlayer(state.player), opponent: copyPlayer(state.opponent), botLevel: state.botLevel };
        nextState.player.removeLettersFromEasel([letter]);
        return nextState;
    }),

    on(addLettersToEasel, (state, { letters }) => {
        const nextState = { player: copyPlayer(state.player), opponent: copyPlayer(state.opponent), botLevel: state.botLevel };
        nextState.player.addLettersToEasel(letters);
        return nextState;
    }),

    on(switchLettersEasel, (state, { positionIndex, destinationIndex }) => {
        const nextState = { player: copyPlayer(state.player), opponent: copyPlayer(state.opponent), botLevel: state.botLevel };
        const nextEasel = JSON.parse(JSON.stringify(state.player.easel));
        const tempLetter = nextEasel[positionIndex];
        nextEasel[positionIndex] = nextEasel[destinationIndex];
        nextEasel[destinationIndex] = tempLetter;
        nextState.player.easel = nextEasel;
        return nextState;
    }),

    on(resetAllState, () => initialState),
);

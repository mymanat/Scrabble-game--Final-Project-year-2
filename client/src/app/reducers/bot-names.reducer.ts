import * as botNamesActions from '@app/actions/bot-names.actions';
import { resetAllState } from '@app/actions/game-status.actions';
import { BotNames } from '@app/interfaces/bot-names';
import { createReducer, on } from '@ngrx/store';

export const botNamesFeatureKey = 'botNames';

export const initialState: BotNames = { easy: ['aaa', 'aaa', 'aaa'], hard: ['bbbb'] };

export const reducer = createReducer(
    initialState,
    on(botNamesActions.loadBotNamesSuccess, (state, { names }) => names),
    on(botNamesActions.addBotName, (state, { name, difficulty }) => {
        const newState = { easy: [...state.easy], hard: [...state.hard] };
        switch (difficulty) {
            case 'Débutant':
                newState.easy.push(name);
                break;
            case 'Expert':
                newState.hard.push(name);
                break;
        }
        return newState;
    }),
    on(botNamesActions.modifyBotName, (state, { oldName, newName, difficulty }) => {
        const newState = { easy: [...state.easy], hard: [...state.hard] };
        switch (difficulty) {
            case 'Débutant':
                newState.easy[newState.easy.findIndex((e) => e === oldName)] = newName;
                break;
            case 'Expert':
                newState.hard[newState.hard.findIndex((e) => e === oldName)] = newName;
                break;
        }
        return newState;
    }),

    on(botNamesActions.deleteBotName, (state, { name, difficulty }) => {
        const newState = { easy: [...state.easy], hard: [...state.hard] };
        switch (difficulty) {
            case 'Débutant':
                newState.easy = newState.easy.filter((n) => name !== n);
                break;
            case 'Expert':
                newState.hard = newState.hard.filter((n) => name !== n);
                break;
        }
        return newState;
    }),

    on(resetAllState, () => initialState),
);

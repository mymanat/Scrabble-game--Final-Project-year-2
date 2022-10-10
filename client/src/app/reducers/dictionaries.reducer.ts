import * as dictionariesActions from '@app/actions/dictionaries.actions';
import { resetAllState } from '@app/actions/game-status.actions';
import { createReducer, on } from '@ngrx/store';
import { DEFAULT_DICTIONARY } from 'common/constants';
import { iDictionary } from 'common/interfaces/dictionary';

export const dictionariesFeatureKey = 'dictionaries';

export const initialState: iDictionary[] = [];

export const reducer = createReducer(
    initialState,
    on(dictionariesActions.loadDictionariesSuccess, (state, { dictionaries }) => {
        // Bouger le dictionaire par default au debut de la liste
        const index = dictionaries.findIndex((d) => d.title === DEFAULT_DICTIONARY);
        const dictionariesCopy = [...dictionaries];
        dictionariesCopy.splice(index, 1);
        const newState = [dictionaries[index], ...dictionariesCopy];
        return newState;
    }),
    on(dictionariesActions.addDictionarySuccess, (state, { dictionary }) => [...state, dictionary]),
    on(dictionariesActions.modifyDictionary, (state, { oldDictionary, newDictionary }) => {
        const newState = [...state];
        newState[newState.findIndex((e) => e.title === oldDictionary.title)] = newDictionary;
        return newState;
    }),
    on(dictionariesActions.deleteDictionary, (state, { dictionary }) => state.filter((e) => e.title !== dictionary.title)),
    on(resetAllState, () => initialState),
);

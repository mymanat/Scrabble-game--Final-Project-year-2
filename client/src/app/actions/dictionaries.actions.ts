import { createAction, props } from '@ngrx/store';
import { iDictionary } from 'common/interfaces/dictionary';

export const loadDictionaries = createAction('[Dictionaries] Load Dictionaries');

export const loadDictionariesSuccess = createAction('[Dictionaries] Load Dictionaries Success', props<{ dictionaries: iDictionary[] }>());

export const loadDictionariesFailure = createAction('[Dictionaries] Load Dictionaries Failure', props<{ error: Error }>());

export const addDictionary = createAction('[Dictionaries] Add Dictionary', props<{ file: File; dictionary: iDictionary }>());

export const addDictionarySuccess = createAction('[Dictionaries] Add Dictionary Success', props<{ dictionary: iDictionary }>());

export const addDictionaryFailed = createAction('[Dictionaries] Add Dictionary Failed', props<{ error: Error }>());

export const resetDictionaries = createAction('[Dictionaries] Reset Dictionaries');

export const deleteDictionary = createAction('[Dictionaries] Delete Dictionary', props<{ dictionary: iDictionary }>());

export const modifyDictionary = createAction('[Dictionaries] Modify Dictionary', props<{ oldDictionary: iDictionary; newDictionary: iDictionary }>());

export const downloadDictionary = createAction('[Dictionaries] Download Dictionary', props<{ dictionary: iDictionary }>());

import { Word } from '@app/classes/word';
import { createAction, props } from '@ngrx/store';
import { Letter } from 'common/classes/letter';

export const placeWord = createAction('[Players] Place Word', props<{ position: string; letters: string }>());

export const placeWordSuccess = createAction('[Players] Place Word Success', props<{ word: Word; newLetters?: Letter[]; newScore?: number }>());

export const exchangeLetters = createAction('[Players] Exchange Letters', props<{ letters: string }>());

export const exchangeLettersSuccess = createAction('[Players] Exchange Letters Success', props<{ oldLetters: Letter[]; newLetters: Letter[] }>());

export const removeLetterFromEasel = createAction('[Players] Remove Letter From Easel', props<{ letter: Letter }>());

export const addLettersToEasel = createAction('[Players] Add Letters To Easel', props<{ letters: Letter[] }>());

export const switchLettersEasel = createAction('[Players] Switch Letters Easel', props<{ positionIndex: number; destinationIndex: number }>());

export const skipTurn = createAction('[Players] Skip Turn');

export const surrender = createAction('[Players] Surrender');

export const resetSocketConnection = createAction('[Players] Reset Socket Connection');

import { createAction, props } from '@ngrx/store';

export const loadBotNames = createAction('[BotNames] Load BotNames');

export const loadBotNamesSuccess = createAction('[BotNames] Load BotNames Success', props<{ names: { hard: string[]; easy: string[] } }>());

export const addBotName = createAction('[BotNames] Add BotName', props<{ name: string; difficulty: string }>());

export const resetBotNames = createAction('[BotNames] Reset BotNames');

export const deleteBotName = createAction('[BotNames] Delete BotName', props<{ name: string; difficulty: string }>());

export const modifyBotName = createAction('[BotNames] Modify BotName', props<{ oldName: string; newName: string; difficulty: string }>());

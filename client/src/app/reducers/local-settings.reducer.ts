import { zoomIn, zoomOut } from '@app/actions/local-settings.actions';
import { createReducer, on } from '@ngrx/store';

export const ZOOM_MAX = 1.5;
export const ZOOM_MIN = 1.0;
export const ZOOM_STEP = 0.1;

export const localSettingsFeatureKey = 'localSettings';

export interface LocalSettings {
    zoom: number;
}

export const initialState: LocalSettings = { zoom: 1 };

export const reducer = createReducer(
    initialState,

    on(zoomIn, (state) => ({
        ...state,
        zoom: state.zoom + ZOOM_STEP > ZOOM_MAX ? ZOOM_MAX : state.zoom + ZOOM_STEP,
    })),

    on(zoomOut, (state) => ({
        ...state,
        zoom: state.zoom - ZOOM_STEP < ZOOM_MIN ? ZOOM_MIN : state.zoom - ZOOM_STEP,
    })),
);

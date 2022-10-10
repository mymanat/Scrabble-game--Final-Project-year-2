import { zoomIn, zoomOut } from '@app/actions/local-settings.actions';
import { reducer, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './local-settings.reducer';

describe('LocalSettings Reducer', () => {
    describe('zoomIn action', () => {
        it('should zoom in', () => {
            const currentZoom = 1.0;
            const action = zoomIn();
            const result = reducer({ zoom: currentZoom }, action);

            const expected = { zoom: currentZoom + ZOOM_STEP };
            expect(result).toEqual(expected);
        });

        it('should not exceed maximum', () => {
            const currentZoom = ZOOM_MAX - ZOOM_STEP / 2;
            const action = zoomIn();
            const result = reducer({ zoom: currentZoom }, action);

            const expected = { zoom: ZOOM_MAX };
            expect(result).toEqual(expected);
        });
    });

    describe('zoomOut action', () => {
        it('should zoom out', () => {
            const currentZoom = 1.3;
            const action = zoomOut();
            const result = reducer({ zoom: currentZoom }, action);

            const expected = { zoom: currentZoom - ZOOM_STEP };
            expect(result).toEqual(expected);
        });

        it('should not be under minimum', () => {
            const currentZoom = ZOOM_MIN + ZOOM_STEP / 2;
            const action = zoomOut();
            const result = reducer({ zoom: currentZoom }, action);

            const expected = { zoom: ZOOM_MIN };
            expect(result).toEqual(expected);
        });
    });
});

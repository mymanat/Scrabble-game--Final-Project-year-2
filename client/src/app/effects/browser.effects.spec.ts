import { TestBed } from '@angular/core/testing';
import { BrowserManagerService } from '@app/services/browser-manager.service';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { BrowserEffects } from './browser.effects';

describe('BrowserEffects', () => {
    let actions$: Observable<unknown>;
    let effects: BrowserEffects;
    let service: jasmine.SpyObj<BrowserManagerService>;

    beforeEach(() => {
        service = jasmine.createSpyObj('BrowserManagerService', ['onBrowserLoad', 'onBrowserClosed']);
        TestBed.configureTestingModule({
            providers: [
                BrowserEffects,
                provideMockActions(() => actions$),
                {
                    provide: BrowserManagerService,
                    useValue: service,
                },
            ],
        });
        effects = TestBed.inject(BrowserEffects);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

    it('reloadEffect$ should call the function onBrowserLoad from player service', (done) => {
        actions$ = of({ type: '[Browser] Reload' });
        effects.reloadEffect$.subscribe();
        expect(service.onBrowserLoad).toHaveBeenCalledWith();
        done();
    });

    it('unloadEffect$ should call the function onBrowserClosed from player service', (done) => {
        actions$ = of({ type: '[Browser] Unload' });
        effects.unloadEffect$.subscribe();
        expect(service.onBrowserClosed).toHaveBeenCalledWith();
        done();
    });
});

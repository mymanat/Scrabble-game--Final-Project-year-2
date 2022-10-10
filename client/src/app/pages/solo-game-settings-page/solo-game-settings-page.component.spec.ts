import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { createSoloRoom } from '@app/actions/room.actions';
import { MultiConfigWindowComponent } from '@app/components/multi-config-window/multi-config-window.component';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { AppMaterialModule } from '@app/modules/material.module';
import { SocketClientService } from '@app/services/socket-client.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { GameOptions } from 'common/classes/game-options';
import { cold } from 'jasmine-marbles';
import { SoloGameSettingsPageComponent } from './solo-game-settings-page.component';

describe('SoloGameSettingsPageComponent', () => {
    let component: SoloGameSettingsPageComponent;
    let fixture: ComponentFixture<SoloGameSettingsPageComponent>;
    let store: MockStore;
    const mockDialogSpy: { close: jasmine.Spy } = {
        close: jasmine.createSpy('close'),
    };

    beforeEach(async () => {
        const socketHelper = new SocketTestHelper();
        await TestBed.configureTestingModule({
            declarations: [SoloGameSettingsPageComponent, MultiConfigWindowComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule, ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockDialogSpy,
                },
                {
                    provide: Router,
                    useValue: {
                        navigate: () => {
                            return;
                        },
                    },
                },
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketHelper,
                        send: (value: string) => {
                            socketHelper.emit(value);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketHelper.on(event, callback);
                            return;
                        },
                    },
                },
                FormBuilder,
                provideMockStore(),
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SoloGameSettingsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch createSoloRoom and call close with the gameOptions and botLevel when onGameOptionsSubmit called', () => {
        const expectedOptions = { name: 'My Name' } as unknown as GameOptions;
        const expectedLevel = 'Débutant';
        component.onGameOptionsSubmit(expectedOptions, expectedLevel);
        const expectedAction = cold('a', { a: createSoloRoom({ gameOptions: expectedOptions, botLevel: expectedLevel }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('should not dispatch createRoom when onGameOptionsSubmit called if bot level is undefined', () => {
        const expectedOptions = { name: 'My Name' } as unknown as GameOptions;
        const expectedLevel = undefined;
        // eslint-disable-next-line dot-notation
        const spy = spyOn(component['store'], 'dispatch');
        component.onGameOptionsSubmit(expectedOptions, expectedLevel);
        expect(spy).not.toHaveBeenCalled();
    });
});

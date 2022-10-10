import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { GamesObjectivesComponent } from './games-objectives.component';

describe('GamesObjectivesComponent', () => {
    let component: GamesObjectivesComponent;
    let fixture: ComponentFixture<GamesObjectivesComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule, AppMaterialModule],
            declarations: [GamesObjectivesComponent],
            providers: [provideMockStore()],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(MockStore);
        store.overrideSelector('gameObjective', { publicObjectives: [], privateObjectives: [] });
        fixture = TestBed.createComponent(GamesObjectivesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('notClickable should preventDefault event', () => {
        let preventDefaultCalled = false;
        const event = {
            preventDefault: () => {
                preventDefaultCalled = true;
                return;
            },
        } as MouseEvent;
        component.notClickable(event);
        expect(preventDefaultCalled).toBeTrue();
    });
});

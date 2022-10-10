/* eslint-disable dot-notation */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellLetterX2Component } from '@app/components/cells/cell-letter-x2/cell-letter-x2.component';
import { CellLetterX3Component } from '@app/components/cells/cell-letter-x3/cell-letter-x3.component';
import { CellStarComponent } from '@app/components/cells/cell-star/cell-star.component';
import { CellWordX2Component } from '@app/components/cells/cell-word-x2/cell-word-x2.component';
import { CellWordX3Component } from '@app/components/cells/cell-word-x3/cell-word-x3.component';
import { LetterComponent } from '@app/components/letter/letter.component';
import { BoardToListPipe } from '@app/pipes/board-to-list.pipe';
import { KeyManagerService } from '@app/services/key-manager.service';
import { StoreModule } from '@ngrx/store';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let keyManagerMock: jasmine.SpyObj<KeyManagerService>;

    beforeEach(async () => {
        keyManagerMock = jasmine.createSpyObj('keyManager', ['onKey']);
        await TestBed.configureTestingModule({
            declarations: [
                BoardComponent,
                BoardToListPipe,
                LetterComponent,
                CellStarComponent,
                CellLetterX2Component,
                CellLetterX3Component,
                CellWordX2Component,
                CellWordX3Component,
            ],
            imports: [StoreModule.forRoot({})],
            providers: [
                {
                    provide: KeyManagerService,
                    useValue: keyManagerMock,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('numberSequence should be equal', () => {
        const sequenceLength = 5;
        /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
        const expectedSequence = [1, 2, 3, 4, 5];

        const numberSequence: number[] = component.numberSequence(sequenceLength);
        expect(numberSequence).toEqual(expectedSequence);
    });

    it('letterSequence should be equal', () => {
        const sequenceLength = 5;
        const expectedSequence = ['A', 'B', 'C', 'D', 'E'];

        const letterSequence: string[] = component.letterSequence(sequenceLength);
        expect(letterSequence).toEqual(expectedSequence);
    });

    it('handleKeyDown should call keyManager.onKey', () => {
        const e: KeyboardEvent = { key: 'a' } as KeyboardEvent;
        component.handleKeyDown(e);
        expect(keyManagerMock.onKey).toHaveBeenCalled();
    });
});

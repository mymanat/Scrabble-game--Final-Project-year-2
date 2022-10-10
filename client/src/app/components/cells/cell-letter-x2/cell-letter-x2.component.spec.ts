import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellLetterX2Component } from './cell-letter-x2.component';

describe('CellLetterX2Component', () => {
    let component: CellLetterX2Component;
    let fixture: ComponentFixture<CellLetterX2Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CellLetterX2Component],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CellLetterX2Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

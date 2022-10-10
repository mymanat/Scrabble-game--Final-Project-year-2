import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellLetterX3Component } from './cell-letter-x3.component';

describe('CellLetterX3Component', () => {
    let component: CellLetterX3Component;
    let fixture: ComponentFixture<CellLetterX3Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CellLetterX3Component],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CellLetterX3Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellWordX2Component } from './cell-word-x2.component';

describe('CellWordX2Component', () => {
    let component: CellWordX2Component;
    let fixture: ComponentFixture<CellWordX2Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CellWordX2Component],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CellWordX2Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellWordX3Component } from './cell-word-x3.component';

describe('CellWordX3Component', () => {
    let component: CellWordX3Component;
    let fixture: ComponentFixture<CellWordX3Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CellWordX3Component],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CellWordX3Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

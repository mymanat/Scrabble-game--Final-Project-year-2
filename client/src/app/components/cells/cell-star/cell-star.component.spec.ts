import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellStarComponent } from './cell-star.component';

describe('CellStarComponent', () => {
    let component: CellStarComponent;
    let fixture: ComponentFixture<CellStarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CellStarComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CellStarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

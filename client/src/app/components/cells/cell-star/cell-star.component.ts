import { Component, Input } from '@angular/core';
import { iVec2 } from 'common/classes/vec2';

@Component({
    /* Nécessaire pour les composantes SVG */
    /* eslint-disable-next-line @angular-eslint/component-selector */
    selector: '[app-cell-star]',
    templateUrl: './cell-star.component.html',
    styleUrls: ['./cell-star.component.scss'],
})
export class CellStarComponent {
    @Input() pos: iVec2;
    constructor() {
        this.pos = { x: 0, y: 0 };
    }
}

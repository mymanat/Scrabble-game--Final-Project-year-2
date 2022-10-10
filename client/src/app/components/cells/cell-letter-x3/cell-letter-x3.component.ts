import { Component, Input } from '@angular/core';
import { iVec2 } from 'common/classes/vec2';

@Component({
    /* Nécessaire pour les composantes SVG */
    /* eslint-disable-next-line @angular-eslint/component-selector */
    selector: '[app-cell-letter-x3]',
    templateUrl: './cell-letter-x3.component.html',
    styleUrls: ['./cell-letter-x3.component.scss'],
})
export class CellLetterX3Component {
    @Input() pos: iVec2;
    constructor() {
        this.pos = { x: 0, y: 0 };
    }
}

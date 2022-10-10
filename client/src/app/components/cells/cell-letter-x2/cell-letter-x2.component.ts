import { Component, Input } from '@angular/core';
import { iVec2 } from 'common/classes/vec2';

@Component({
    /* Nécessaire pour les composantes SVG */
    /* eslint-disable-next-line @angular-eslint/component-selector */
    selector: '[app-cell-letter-x2]',
    templateUrl: './cell-letter-x2.component.html',
    styleUrls: ['./cell-letter-x2.component.scss'],
})
export class CellLetterX2Component {
    @Input() pos: iVec2;
    constructor() {
        this.pos = { x: 0, y: 0 };
    }
}

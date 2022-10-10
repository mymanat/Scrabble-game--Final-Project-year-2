import { Component, Input } from '@angular/core';
import { iVec2 } from 'common/classes/vec2';

@Component({
    /* Nécessaire pour les composantes SVG */
    /* eslint-disable-next-line @angular-eslint/component-selector */
    selector: '[app-cell-word-x3]',
    templateUrl: './cell-word-x3.component.html',
    styleUrls: ['./cell-word-x3.component.scss'],
})
export class CellWordX3Component {
    @Input() pos: iVec2;
    constructor() {
        this.pos = { x: 0, y: 0 };
    }
}

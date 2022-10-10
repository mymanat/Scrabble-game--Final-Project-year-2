import { Direction } from '@app/enums/direction';
import { Vec2 } from 'common/classes/vec2';

export class BoardSelection {
    constructor(public cell: Vec2 | null = null, public orientation: Direction | null = null, public modifiedCells: Vec2[] = []) {}

    copy(): BoardSelection {
        const cell = this.cell?.copy();
        return new BoardSelection(cell, this.orientation, [...this.modifiedCells]);
    }
}

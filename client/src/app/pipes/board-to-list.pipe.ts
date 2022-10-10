import { Pipe, PipeTransform } from '@angular/core';
import { PlacedLetter } from '@app/interfaces/placed-letter';
import { BoardState } from '@app/reducers/board.reducer';
import { Letter } from 'common/classes/letter';
import { Vec2 } from 'common/classes/vec2';

@Pipe({
    name: 'boardToList',
})
export class BoardToListPipe implements PipeTransform {
    colorForLastWord = 'blue';
    transform(value: BoardState | null): PlacedLetter[] {
        const list: PlacedLetter[] = [];
        if (!value) return list;
        for (let i = 0; i < value.board.length; i++) {
            for (let j = 0; j < value.board[i].length; j++) {
                if (!value.board[i][j]) continue;
                const isBlank = !!value.blanks.find((v) => v.x === i && v.y === j);
                const isLastPlaced = !!value.lastPlacedWord.find((v) => v.x === i && v.y === j);
                list.push({
                    letter: value.board[i][j] as Letter,
                    position: new Vec2(i, j),
                    blank: isBlank,
                    lastPlacedWord: isLastPlaced ? this.colorForLastWord : undefined,
                });
            }
        }
        return list;
    }
}

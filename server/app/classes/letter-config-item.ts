import { Letter } from 'common/classes/letter';

export const copyLetterConfigItem: (item: LetterConfigItem) => LetterConfigItem = (item) => {
    return new LetterConfigItem(item.letter, item.points, item.amount);
};

export class LetterConfigItem {
    constructor(public letter: Letter, public points: number, public amount: number) {}
}

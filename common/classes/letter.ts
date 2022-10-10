export type Letter =
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'S'
    | 'T'
    | 'U'
    | 'V'
    | 'W'
    | 'X'
    | 'Y'
    | 'Z'
    // Case vide
    | '*';

export const BLANK_LETTER = '*' as Letter;

export const stringToLetter = (string: string): Letter => {
    const char = string.charAt(0);
    if (char === char.toUpperCase()) return '*';
    return char.toUpperCase() as Letter;
};

export const stringToLetters = (string: string): Letter[] => {
    const returnValue: Letter[] = [];
    for (const s of string) returnValue.push(stringToLetter(s));
    return returnValue;
};

export const lettersToString = (letters: Letter[]): string => {
    let acc = '';
    letters.forEach((l) => (acc += l as string));
    return acc;
};

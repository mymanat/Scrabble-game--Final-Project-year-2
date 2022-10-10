export interface HighScore {
    name: string;
    score: number;
}

export const NUMBER_OF_SCORES = 5;

export const DEFAULT_HIGHSCORE = {
    classical: [
        { name: 'name1', score: 0 },
        { name: 'name2', score: 1 },
        { name: 'name3', score: 2 },
        { name: 'name4', score: 3 },
        { name: 'name5', score: 4 },
    ] as HighScore[],
    log2990: [
        { name: 'name1', score: 0 },
        { name: 'name2', score: 1 },
        { name: 'name3', score: 2 },
        { name: 'name4', score: 3 },
        { name: 'name5', score: 4 },
    ] as HighScore[],
};

export const HIGHSCORE_DATABASE = {
    uri: 'mongodb+srv://LOG2990equipe101:Polytechnique2022@cluster0.kuvzt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    highScore: {
        name: 'Scores_DB',
        collections: {
            classical: 'ScoresClassic',
            log2990: 'ScoresLog2990',
        },
    },
};

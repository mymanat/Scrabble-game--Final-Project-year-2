import { Log2990Objective } from 'common/interfaces/log2990-objectives';

export const LOG2990OBJECTIVES: Log2990Objective[] = [
    {
        description: 'Créer un palindrome de 4 lettres ou plus',
        value: 'Double les points de placement',
        isValidated: false,
    },
    {
        description: 'Placer 3 ou plus consonnes seulement',
        value: 'Bonus de 60 points',
        isValidated: false,
    },
    {
        description: "Ralonger le début et la fin d'un mot existant de deux lettres ou plus",
        value: 'Bonus de 30 points',
        isValidated: false,
    },
    {
        description: 'Faire un placement rapportant plus de 20 points dans les 10 premières secondes du tour',
        value: 'Bonus de 45 points',
        isValidated: false,
    },
    {
        description: 'Placer deux lettres qui valent 8 points ou plus en un tour',
        value: 'Bonus de 48 points',
        isValidated: false,
    },
    {
        description: 'Faire un mot de 10 lettres ou plus',
        value: 'Bonus de 50 points',
        isValidated: false,
    },
    {
        description: 'Avoir exactement 69 points',
        value: 'Bonus de 69 points',
        isValidated: false,
    },
    {
        description: 'Placer le mot : ',
        value: 'Bonus de 70 points',
        isValidated: false,
    },
];

export const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];

export const NO_POINTS = 0;

export const HISTORY_DATABASE = {
    uri: 'mongodb+srv://LOG2990equipe101:Polytechnique2022@cluster0.kuvzt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    gameHistory: {
        name: 'Historique_DB',
        collections: {
            data: 'PartiesJouées',
        },
    },
};

export const BOT_NAME_DATABASE = {
    uri: 'mongodb+srv://LOG2990equipe101:Polytechnique2022@cluster0.kuvzt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    botNames: {
        name: 'Bot_Names_DB',
        collections: {
            easyBot: 'Nom bot débutant',
            hardBot: 'Nom bot expert',
        },
    },
};

export class GameError extends Error {
    constructor(public type: GameErrorType) {
        super(type);
    }
}

export enum GameErrorType {
    WrongPlayer = "Ce n'est pas le tour de ce joueur",
    LettersAreNotInEasel = 'Le chevalet de ce joueur ne contient pas ces lettres',
    PositionOccupied = 'Une lettre a déja été placée a cette position sur le plateau',
    InvalidWord = 'Ce placement crée une mot invalide',
    LetterIsNull = 'Lettre nulle',
    UndefinedPoints = "Cette lettre n'as pas de valeur associée",
    WrongPosition = 'Ce mot est dans la mauvaise position',
    OutOfBoundPosition = "La position du mot est à l'extérieur du plateau",
    WrongPlaceArgument = 'Les arguments pour la commande placer sont mal formés',
    WrongDrawArgument = 'Les arguments pour la commande échanger sont mal formés',
    WrongSkipArgument = 'Les arguments pour la commande passer sont mal formés',
    WrongHintArgument = 'Les arguments pour la commande indice sont mal formés',
    GameIsFinished = 'La partie est finie',
    GameNotExists = "La partie n'existe pas",
    WordNotConnected = 'Le placement de mot ne connecte a aucun autre mot',
    BadStartingMove = 'Le placement de mot de départ est invalide',
}

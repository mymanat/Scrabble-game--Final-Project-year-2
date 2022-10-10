import { LOG2990OBJECTIVES } from '@app/constantes';
import { ObjectivesVerifierService } from '@app/services/objectives-verifier.service';
import { Log2990Objective } from 'common/interfaces/log2990-objectives';
import { Container } from 'typedi';
import { BONUS_POINTS_FOR_FULL_EASEL, Game } from './game/game';
import { PlacedLetter } from './placed-letter';

export enum Objectives {
    OBJECTIVE1 = 'Créer un palindrome de 4 lettres ou plus',
    OBJECTIVE2 = 'Placer 3 ou plus consonnes seulement',
    OBJECTIVE3 = "Ralonger le début et la fin d'un mot existant de deux lettres ou plus",
    OBJECTIVE4 = 'Faire un placement rapportant plus de 20 points dans les 10 premières secondes du tour',
    OBJECTIVE5 = 'Placer deux lettres qui valent 8 points ou plus en un tour',
    OBJECTIVE6 = 'Faire un mot de 10 lettres ou plus',
    OBJECTIVE7 = 'Avoir exactement 69 points',
    OBJECTIVE8 = 'Placer le mot : ',
}

export class Log2990ObjectivesHandler {
    private hostObjectives: Log2990Objective[];
    private clientObjectives: Log2990Objective[];
    private objectivesVerifier: ObjectivesVerifierService;
    private chosenWordObjective8: string;

    constructor(private game: Game) {
        this.hostObjectives = [];
        this.clientObjectives = [];
        this.objectivesVerifier = Container.get(ObjectivesVerifierService);
        this.setUpPlayerObjectives();
    }

    verifyObjectives(playerNumber: number, placedLetters: PlacedLetter[], score: number): number {
        const objectiveList = playerNumber === 0 ? this.hostObjectives : this.clientObjectives;
        const opponentObjectiveList = playerNumber === 0 ? this.clientObjectives : this.hostObjectives;
        const createdWords = this.game.board.getAffectedWords(placedLetters);
        const amountLettersForBonus = 7;
        const privateObjectiveIndex = 2;
        let bonusAmount = 0;
        objectiveList.forEach((objective, index) => {
            const startScore = score;
            if (objective.isValidated) return;
            switch (objective.description) {
                case Objectives.OBJECTIVE1:
                    score *= this.objectivesVerifier.verifyFirstObjective(createdWords);
                    break;
                case Objectives.OBJECTIVE2:
                    score += this.objectivesVerifier.verifySecondObjective(placedLetters);
                    break;
                case Objectives.OBJECTIVE3:
                    score += this.objectivesVerifier.verifyThirdObjective(placedLetters);
                    break;
                case Objectives.OBJECTIVE4:
                    score += this.objectivesVerifier.verifyFourthObjective(this.game, score);
                    break;
                case Objectives.OBJECTIVE5:
                    score += this.objectivesVerifier.verifyFifthObjective(placedLetters, this.game);
                    break;
                case Objectives.OBJECTIVE6:
                    score += this.objectivesVerifier.verifySixthObjective(createdWords);
                    break;
                case Objectives.OBJECTIVE7:
                    if (placedLetters.length === amountLettersForBonus) bonusAmount = BONUS_POINTS_FOR_FULL_EASEL;
                    score += this.objectivesVerifier.verifySeventhObjective(this.game.players[playerNumber].score + score + bonusAmount);
                    break;
                case Objectives.OBJECTIVE8:
                    score += this.objectivesVerifier.verifyEighthObjective(createdWords, this.chosenWordObjective8);
                    break;
            }
            if (startScore !== score) {
                objective.isValidated = true;
                if (index === privateObjectiveIndex) {
                    opponentObjectiveList.push(objective);
                }
            }
        });
        return score;
    }

    switchingPlayersObjectives(): void {
        const tempList = this.hostObjectives;
        this.hostObjectives = this.clientObjectives;
        this.clientObjectives = tempList;
    }

    retrieveLog2990Objective(playerNumber: number): Log2990Objective[] {
        return playerNumber === 0 ? this.hostObjectives : this.clientObjectives;
    }

    private setUpPlayerObjectives(): void {
        const amountObjectivesToFind = 4;
        const totalAmountObjectives = 8;
        const objectives = new Set<number>();
        while (objectives.size !== amountObjectivesToFind) {
            objectives.add(Math.floor(Math.random() * totalAmountObjectives));
        }
        const publicObjectives = 2;
        for (let index = 0; index < publicObjectives; index++) {
            const publicObjective = this.determineObjective([...objectives][index]);
            this.hostObjectives.push(publicObjective);
            this.clientObjectives.push(publicObjective);
        }
        const hostPrivateObjectiveIndex = 2;
        this.hostObjectives.push(this.determineObjective([...objectives][hostPrivateObjectiveIndex]));
        const clientPrivateObjectiveIndex = 3;
        this.clientObjectives.push(this.determineObjective([...objectives][clientPrivateObjectiveIndex]));
    }

    private determineObjective(objectiveNumber: number): Log2990Objective {
        const objective = { ...LOG2990OBJECTIVES[objectiveNumber] };
        if (objective.description !== Objectives.OBJECTIVE8) return objective;
        const objectiveWordLength = 6;
        this.chosenWordObjective8 = this.game.board.getRandomWord(objectiveWordLength);
        objective.description = objective.description + this.chosenWordObjective8;
        return objective;
    }
}

/* eslint-disable dot-notation */
import { LOG2990OBJECTIVES } from '@app/constantes';
import { expect } from 'chai';
import { restore, stub } from 'sinon';
import { Game } from './game/game';
import { Log2990ObjectivesHandler } from './log2990-objectives-handler';
import { PlacedLetter } from './placed-letter';

describe('Log2990 Objective Handler', () => {
    let log2990ObjectiveHandler: Log2990ObjectivesHandler;
    let fakeGame: Game;
    beforeEach(() => {
        fakeGame = { board: { getAffectedWords: () => [[]], getRandomWord: () => 'abc' }, players: [{}, { score: 2 }] } as unknown as Game;
        log2990ObjectiveHandler = new Log2990ObjectivesHandler(fakeGame);
    });
    afterEach(() => {
        restore();
    });

    it('constructor and setUpPlayerObjectives should give 3 objectives to host and client', () => {
        expect(log2990ObjectiveHandler['clientObjectives'].length).to.equal(3);
        expect(log2990ObjectiveHandler['hostObjectives'].length).to.equal(3);
        expect(log2990ObjectiveHandler['clientObjectives'][0]).to.equal(log2990ObjectiveHandler['hostObjectives'][0]);
        expect(log2990ObjectiveHandler['clientObjectives'][1]).to.equal(log2990ObjectiveHandler['hostObjectives'][1]);
    });

    it('switchingPlayersObjectives should switch the objectives of players', () => {
        const oldHostObjectives = log2990ObjectiveHandler['hostObjectives'];
        const oldClientObjectives = log2990ObjectiveHandler['clientObjectives'];
        log2990ObjectiveHandler.switchingPlayersObjectives();
        expect(log2990ObjectiveHandler['clientObjectives']).to.equal(oldHostObjectives);
        expect(log2990ObjectiveHandler['hostObjectives']).to.equal(oldClientObjectives);
    });

    describe('Verify Objectives', () => {
        it('verifyObjectives should call verifyFirstObjective if the Objective is the first one', () => {
            log2990ObjectiveHandler['hostObjectives'] = [LOG2990OBJECTIVES[0]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifyFirstObjective').callsFake(() => 1);
            log2990ObjectiveHandler.verifyObjectives(0, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifySecondObjective if the Objective is the second one', () => {
            log2990ObjectiveHandler['hostObjectives'] = [LOG2990OBJECTIVES[1]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySecondObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(0, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifyThirdObjective if the Objective is the third one', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[2]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifyThirdObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifyFourthObjective if the Objective is the fourth one', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[3]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifyFourthObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifyFifthObjective if the Objective is the fourth one', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[4]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifyFifthObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifySixthObjective if the Objective is the sixth one', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[5]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySixthObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifySeventhObjective if the Objective is the seventh one', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[6]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySeventhObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });
        it('verifyObjectives should call verifyEighthObjective if the Objective is the eighth one', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[7]];
            log2990ObjectiveHandler['chosenWordObjective8'] = '';
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifyEighthObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
        });

        it('verifyObjectives should call verifySeventhObjective if the Objective is the seventh one and add a bonus when 7 letters placed', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[6]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySeventhObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(
                1,
                [
                    { letter: 'A' } as PlacedLetter,
                    { letter: 'A' } as PlacedLetter,
                    { letter: 'A' } as PlacedLetter,
                    { letter: 'A' } as PlacedLetter,
                    { letter: 'A' } as PlacedLetter,
                    { letter: 'A' } as PlacedLetter,
                    { letter: 'A' } as PlacedLetter,
                ],
                0,
            );
            const expectedScore = 52;
            expect(objectiveStub.calledOnceWith(expectedScore)).to.equal(true);
        });

        it('verifyObjectives should set is validated to true if score is changed', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[6]];
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySeventhObjective').callsFake(() => 1);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.calledOnce).to.equal(true);
            expect(log2990ObjectiveHandler['clientObjectives'][0].isValidated).to.equal(true);
        });

        it('verifyObjectives should not call verifySeventhObjective if the Objective isValidated', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[0], LOG2990OBJECTIVES[6]];
            log2990ObjectiveHandler['clientObjectives'][1].isValidated = true;
            const objectiveStub = stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySeventhObjective').callsFake(() => 0);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(objectiveStub.called).to.equal(false);
            log2990ObjectiveHandler['clientObjectives'][1].isValidated = false;
        });

        it('verifyObjectives should add the private objective to host if client completes it', () => {
            log2990ObjectiveHandler['clientObjectives'] = [LOG2990OBJECTIVES[2], LOG2990OBJECTIVES[1], LOG2990OBJECTIVES[6]];
            log2990ObjectiveHandler['hostObjectives'] = [LOG2990OBJECTIVES[0], LOG2990OBJECTIVES[1], LOG2990OBJECTIVES[2]];
            stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifyThirdObjective').callsFake(() => 0);
            stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySecondObjective').callsFake(() => 0);
            stub(log2990ObjectiveHandler['objectivesVerifier'], 'verifySeventhObjective').callsFake(() => 1);
            log2990ObjectiveHandler.verifyObjectives(1, [], 0);
            expect(log2990ObjectiveHandler['hostObjectives'][3]).to.equal(log2990ObjectiveHandler['clientObjectives'][2]);
        });

        it('determineObjective should call getRandomWord if the ObjectiveNumber is seven', () => {
            const getRandomWordStub = stub(fakeGame.board, 'getRandomWord');
            const objectiveNumber = 7;
            log2990ObjectiveHandler['determineObjective'](objectiveNumber);
            expect(getRandomWordStub.called).to.equal(true);
        });

        it('retrieveLog2990Objective with 0 should return hostObjectives', () => {
            const expectedList = [LOG2990OBJECTIVES[0]];
            log2990ObjectiveHandler['hostObjectives'] = expectedList;
            expect(log2990ObjectiveHandler.retrieveLog2990Objective(0)).to.equal(expectedList);
        });
        it('retrieveLog2990Objective with 1 should return clientObjectives', () => {
            const expectedList = [LOG2990OBJECTIVES[0]];
            log2990ObjectiveHandler['clientObjectives'] = expectedList;
            expect(log2990ObjectiveHandler.retrieveLog2990Objective(1)).to.equal(expectedList);
        });
    });
});

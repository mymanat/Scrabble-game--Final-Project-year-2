/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { GameError, GameErrorType } from '@app/classes/game.exception';
import { Game } from '@app/classes/game/game';
import { PlacedLetter } from '@app/classes/placed-letter';
import { Solution } from '@app/interfaces/solution';
import { expect } from 'chai';
import { Dictionary } from 'common/classes/dictionary';
import { Vec2 } from 'common/classes/vec2';
import { BOARD_SIZE } from 'common/constants';
import { restore, stub } from 'sinon';
import { Container } from 'typedi';
import { BotDifficulty, BotService } from './bot.service';
import { DictionaryService } from './dictionary.service';
import { GameConfigService } from './game-config.service';

describe('Bot service tests', () => {
    let service: BotService;
    let fakeGame: Game;

    const solutionA: Solution = {
        letters: [new PlacedLetter('A', new Vec2(6, 7)), new PlacedLetter('B', new Vec2(7, 7))],
        blanks: [],
        direction: new Vec2(1, 0),
    };
    const solutionB: Solution = {
        letters: [new PlacedLetter('A', new Vec2(7, 8))],
        blanks: [],
        direction: new Vec2(0, 1),
    };
    const solutionC: Solution = {
        letters: [
            new PlacedLetter('M', new Vec2(6, 7)),
            new PlacedLetter('A', new Vec2(7, 7)),
            new PlacedLetter('R', new Vec2(8, 7)),
            new PlacedLetter('T', new Vec2(9, 7)),
            new PlacedLetter('E', new Vec2(10, 7)),
            new PlacedLetter('A', new Vec2(11, 7)),
            new PlacedLetter('U', new Vec2(12, 7)),
        ],
        blanks: [],
        direction: new Vec2(0, 1),
    };

    beforeEach(async () => {
        await Container.get(DictionaryService).init();
        await Container.get(GameConfigService).init();
        service = new BotService();
        const fakeBoard = new Array(BOARD_SIZE).fill(new Array(BOARD_SIZE).fill(null));
        fakeGame = {
            players: [{}, { easel: ['A', 'B', 'C', 'D', 'E', '*'] }],
            bag: { letters: ['A', 'B', 'C', 'D', 'E', '*'] },
            board: { board: fakeBoard, scorePosition: () => 2, getAffectedWords: (letters: PlacedLetter[]) => [letters] },
            config: Container.get(GameConfigService).configs[0],
            dictionary: Container.get(DictionaryService).getDictionary('Francais') as Dictionary,
        } as unknown as Game;
    });

    afterEach(() => {
        restore();
    });

    it('move should call easyBotMove if the difficulty is easy', () => {
        const easyBotMoveStub = stub(service as any, 'easyBotMove').callsFake(() => '');
        service.move(fakeGame, BotDifficulty.Easy);
        expect(easyBotMoveStub.calledOnce).to.equal(true);
    });

    it('move should call hardBotMove if the difficulty is Hard', async () => {
        const hardBotMoveStub = stub(service as any, 'hardBotMove').callsFake(() => '');
        service.move(fakeGame, BotDifficulty.Hard);
        expect(hardBotMoveStub.calledOnce).to.equal(true);
    });

    it('easyBotMove should return pass command if the random generated number is between 0 and 0.1', async () => {
        const expectedNumber = 0.05;
        stub(Math, 'random').callsFake(() => expectedNumber);
        expect(await service['easyBotMove'](fakeGame)).to.equal('passer');
    });

    it('easyBotMove should call exchangeCommand if the random generated number is between 0.1 and 0.2', async () => {
        const expectedNumber = 0.18;
        const expectedResult = 'échanger a';
        stub(Math, 'random').callsFake(() => expectedNumber);
        const exchangeCommandStub = stub(service as any, 'exchangeCommand').callsFake(() => expectedResult);
        expect(await service['easyBotMove'](fakeGame)).to.equal(expectedResult);
        expect(exchangeCommandStub.called).to.equal(true);
    });

    it('easyBotMove should call placeCommand if the random generated number is between 0.2 and 1', async () => {
        const expectedNumber = 0.482;
        const expectedResult = 'placer h7h place';
        stub(Math, 'random').callsFake(() => expectedNumber);
        const placeCommandStub = stub(service as any, 'placeCommand').callsFake(() => expectedResult);
        expect(await service['easyBotMove'](fakeGame)).to.equal(expectedResult);
        expect(placeCommandStub.called).to.equal(true);
    });

    it('hardBotMove should return pass command if no words are found and no letters are in the bag', async () => {
        stub(service as any, 'placeCommand').callsFake(() => 'passer');
        fakeGame.bag.letters = [];
        expect(await service['hardBotMove'](fakeGame)).to.equal('passer');
    });

    it('hardBotMove should return exchange command with all letters if more than 7 letters are in the bag and no words are found', async () => {
        stub(service as any, 'placeCommand').callsFake(() => 'passer');
        expect(await service['hardBotMove'](fakeGame)).to.equal('échanger abcde*');
    });

    it('hardBotMove should return placeCommand if it returns something different than pass', async () => {
        const expectedCommand = 'placer h7h u';
        stub(service as any, 'placeCommand').callsFake(() => expectedCommand);
        expect(await service['hardBotMove'](fakeGame)).to.equal(expectedCommand);
    });

    it('hardBotMove should call findLettersToExchange if there are less letters in bag than in player easel and no word placement', async () => {
        fakeGame.bag.letters = ['A'];
        stub(service as any, 'placeCommand').callsFake(() => 'passer');
        const findLettersToExchangeStub = stub(service as any, 'findLettersToExchange');
        await service['hardBotMove'](fakeGame);
        expect(findLettersToExchangeStub.calledOnceWith(1, fakeGame.players[1].easel)).to.equal(true);
    });

    it('placeCommand should call determineWord if there is at least a solution', (done) => {
        fakeGame.board.board[7][7] = 'E';
        fakeGame.players[1].easel = ['L'];
        stub(service as any, 'determineWord').callsFake(() => done());
        service['placeCommand'](fakeGame, BotDifficulty.Easy);
    });

    it('placeCommand should call determineWord if there is at least a solution and return passer if it returns passer', async () => {
        fakeGame.board.board[7][7] = 'E';
        fakeGame.players[1].easel = ['L'];
        stub(service as any, 'determineWord').callsFake(() => 'passer');
        expect(await service['placeCommand'](fakeGame, BotDifficulty.Easy)).to.equal('passer');
    });

    it('placeCommand should return an error if solver get easy solution return an error', async () => {
        fakeGame.board.board[7][7] = 'E';
        fakeGame.players[1].easel = ['L'];
        stub(fakeGame.board, 'scorePosition').callsFake(() => new GameError(GameErrorType.LetterIsNull));
        expect((await service['placeCommand'](fakeGame, BotDifficulty.Easy)) instanceof GameError).to.equal(true);
    });

    it('placeCommand should not call determineWord if there is no solution and return passer', async () => {
        fakeGame.players[1].easel = ['X'];
        const determineWordStub = stub(service as any, 'determineWord');
        const placeResult = await service['placeCommand'](fakeGame, BotDifficulty.Easy);
        expect(placeResult).to.equal('passer');
        expect(determineWordStub.calledOnce).to.equal(false);
    });

    it('exchangeCommand should retrieve a random number of letters to exchange', () => {
        const minExchangeCommandLength = 9;
        const exchangeResult = service['exchangeCommand'](fakeGame);
        expect(exchangeResult.includes('échanger')).to.equal(true);
        expect(exchangeResult.length).to.be.greaterThan(minExchangeCommandLength);
    });

    it('exchangeCommand should send pass command if there are not enough letters in the bag', () => {
        fakeGame.bag.letters = [];
        expect(service['exchangeCommand'](fakeGame)).to.equal('passer');
    });

    it('determineWord should send the exchange with least points if the random number is between 0 and 0.4 (40% chance) with botLevel easy', () => {
        const expectedNumber = 0.15;
        stub(Math, 'random').callsFake(() => expectedNumber);
        const fakePlacements: [Solution, number][] = [];
        fakePlacements.push([solutionA, 2]);
        fakePlacements.push([solutionB, 10]);
        expect(service['determineEasyBotWord'](fakePlacements)).to.equal('h7h ab');
    });

    it('determineWord should return passer if all solutions found are greater than 18 points', () => {
        const fakePlacements: [Solution, number][] = [];
        fakePlacements.push([solutionB, 30]);
        expect(service['determineWord'](fakePlacements, BotDifficulty.Easy)).to.equal('passer');
    });

    it('determineWord should send the exchange with middle amount of points with random number between 0.4 and 0.7 with botLevel easy', () => {
        const expectedNumber = 0.69;
        stub(Math, 'random').callsFake(() => expectedNumber);
        const fakePlacements: [Solution, number][] = [];
        fakePlacements.push([solutionA, 10]);
        fakePlacements.push([solutionB, 15]);
        expect(service['determineEasyBotWord'](fakePlacements)).to.equal('h7h ab');
    });

    it('determineWord should send the exchange with highest amount of points with random number between 0.7 and 1 with botLevel easy', () => {
        const expectedNumber = 0.92;
        stub(Math, 'random').callsFake(() => expectedNumber);
        const fakePlacements: [Solution, number][] = [];
        fakePlacements.push([solutionA, 15]);
        fakePlacements.push([solutionB, 10]);
        expect(service['determineEasyBotWord'](fakePlacements)).to.equal('h7h ab');
    });

    it('determineWord should call determineHardBotWord if bot difficulty hard', () => {
        const determineHardBotWordStub = stub(service as any, 'determineHardBotWord');
        const fakePlacements: [Solution, number][] = [[solutionA, 2]];
        service['determineWord'](fakePlacements, BotDifficulty.Hard);
        expect(determineHardBotWordStub.calledWith(fakePlacements)).to.equal(true);
    });

    it('determineWord should call determineEasyBotWord if bot difficulty Easy', () => {
        const determineEasyHardBotWordStub = stub(service as any, 'determineEasyBotWord');
        const fakePlacements: [Solution, number][] = [[solutionA, 2]];
        service['determineWord'](fakePlacements, BotDifficulty.Easy);
        expect(determineEasyHardBotWordStub.calledWith(fakePlacements)).to.equal(true);
    });

    it('determineHardBotWord return the best found word and take count of a 7 letter placement bonus', () => {
        const fakePlacements: [Solution, number][] = [
            [solutionA, 2],
            [solutionC, 1],
            [solutionB, 30],
        ];
        const expectedResult = 'h7v marteau';
        const result = service['determineHardBotWord'](fakePlacements);
        expect(result).to.equal(expectedResult);
    });
});

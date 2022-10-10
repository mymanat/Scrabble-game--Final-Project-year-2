/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { GameError, GameErrorType } from '@app/classes/game.exception';
import { Log2990ObjectivesHandler } from '@app/classes/log2990-objectives-handler';
import { PlacedLetter } from '@app/classes/placed-letter';
import { BotDifficulty } from '@app/services/bot.service';
import { DictionaryService } from '@app/services/dictionary.service';
import { GameConfigService } from '@app/services/game-config.service';
import { expect } from 'chai';
import { Dictionary } from 'common/classes/dictionary';
import { GameOptions } from 'common/classes/game-options';
import { BLANK_LETTER, Letter, stringToLetters } from 'common/classes/letter';
import { Vec2 } from 'common/classes/vec2';
import { GameMode } from 'common/interfaces/game-mode';
import { spy, stub, useFakeTimers } from 'sinon';
import { Container } from 'typedi';
import { BONUS_POINTS_FOR_FULL_EASEL, Game, MAX_LETTERS_IN_EASEL, MILLISECONDS_PER_SEC } from './game';

describe('game', () => {
    let game: Game;
    let activePlayer: number;
    const gameOptions: GameOptions = new GameOptions('host', 'dict', GameMode.Classical, 60);
    const timerCallbackMock = () => {
        return undefined;
    };
    const afterTurnCallbackMock: () => Promise<undefined | GameError> = async () => {
        return undefined;
    };
    Container.get(GameConfigService).init();

    beforeEach(async () => {
        const dicService = Container.get(DictionaryService);
        await dicService.init();
        const dictionary = dicService.getDictionary('Francais') as Dictionary;
        game = new Game(
            Container.get(GameConfigService).configs[0],
            dictionary,
            ['player 1', 'player 2'],
            gameOptions,
            timerCallbackMock,
            afterTurnCallbackMock,
        );
        activePlayer = game.activePlayer;
    });

    it('constructor', () => {
        expect(game.players.length).to.eq(2);
        expect(game.activePlayer === 0 || game.activePlayer === 1).to.eq(true);
        const amountOfEachLetters = game.config.letters.map((l) => l.amount);
        const totalLetters = amountOfEachLetters.reduce((sum, amount) => sum + amount);
        const totalLettersInEachPlayerEasel = MAX_LETTERS_IN_EASEL;
        const totalAmountOfPlayers = 2;
        expect(game.bag.letters.length).to.eq(totalLetters - totalLettersInEachPlayerEasel * totalAmountOfPlayers);
        expect(game['turnsSkipped']).to.eq(0);
        expect(game['log2990Objectives']).to.equal(undefined);
    });

    it('constructor with GameMode Log2990 should instantiate a Log2990ObjectivesHandler', () => {
        const options = new GameOptions('host', 'dict', GameMode.Log2990, 60);
        game = new Game(
            Container.get(GameConfigService).configs[0],
            Container.get(DictionaryService).getDictionary('Francais') as Dictionary,
            ['player 1', 'player 2'],
            options,
            timerCallbackMock,
            afterTurnCallbackMock,
        );
        expect(game.players.length).to.eq(2);
        expect(game.activePlayer === 0 || game.activePlayer === 1).to.eq(true);
        const amountOfEachLetters = game.config.letters.map((l) => l.amount);
        const totalLetters = amountOfEachLetters.reduce((sum, amount) => sum + amount);
        const totalLettersInEachPlayerEasel = MAX_LETTERS_IN_EASEL;
        const totalAmountOfPlayers = 2;
        expect(game.bag.letters.length).to.eq(totalLetters - totalLettersInEachPlayerEasel * totalAmountOfPlayers);
        expect(game['turnsSkipped']).to.eq(0);
        expect(game['log2990Objectives']).not.to.equal(undefined);
    });

    it('place should score according to scorePosition on correct placement', () => {
        const lettersToPlace: Letter[] = ['C', 'O', 'N'];

        // mettre des lettres sur le chevalet du joueur pour que le placement soit possible
        lettersToPlace.forEach((l) => {
            game['getActivePlayer']().easel.push(l);
        });

        expect(
            // place 'con' across in the middle
            game.place(
                lettersToPlace.map((l, i) => new PlacedLetter(l, new Vec2(6 + i, 7))),
                [],
                game.activePlayer,
            ) instanceof GameError,
        ).to.equal(false);

        const thisPlayerScore = game.players[activePlayer].score;
        const positionsOfPlacement = lettersToPlace.map((_l, i) => new PlacedLetter(lettersToPlace[i], new Vec2(6 + i, 7)));
        const wordMultiplier = 2;
        const expectedPoints = (game.board['scorePosition'](positionsOfPlacement) as number) * wordMultiplier;
        expect(thisPlayerScore).to.eq(expectedPoints);

        // ce n'est plus le tour du joueur actif
        expect(game.activePlayer).to.not.eq(activePlayer);
    });

    it('place should score according to scorePosition on correct placement with a blank letter', () => {
        const lettersToPlace: Letter[] = ['C', 'O', 'N'];

        lettersToPlace.slice(1, 3).forEach((l) => {
            game['getActivePlayer']().easel.push(l);
        });

        game['getActivePlayer']().easel.push(BLANK_LETTER);

        expect(
            game.place(
                lettersToPlace.map((l, i) => new PlacedLetter(l, new Vec2(6 + i, 7))),
                [0],
                game.activePlayer,
            ) instanceof GameError,
        ).to.equal(false);

        const thisPlayerScore = game.players[activePlayer].score;
        const positionsOfPlacement = lettersToPlace.map((_l, i) => new PlacedLetter(lettersToPlace[i], new Vec2(6 + i, 7)));
        const expectedPoints = game.board['scorePosition'](positionsOfPlacement) as number;
        const wordMultiplier = 2;
        expect(thisPlayerScore).to.eq(expectedPoints * wordMultiplier);

        expect(game.activePlayer).to.not.eq(activePlayer);
    });

    it('place should return an error on correct placement as second placement if not connected to other words', () => {
        const lettersToPlace: Letter[] = ['C', 'O', 'N'];
        game['placeCounter'] = 1;
        lettersToPlace.forEach((l) => {
            game['getActivePlayer']().easel.push(l);
        });

        expect(
            game.place(
                lettersToPlace.map((l, i) => new PlacedLetter(l, new Vec2(6 + i, 7))),
                [],
                game.activePlayer,
            ) instanceof GameError,
        ).to.equal(true);
    });

    it('place should return an error on correct placement as second placement if not connected to other words', () => {
        const lettersToPlace: Letter[] = ['C', 'O', 'N'];
        game['placeCounter'] = 1;
        lettersToPlace.forEach((l) => {
            game['getActivePlayer']().easel.push(l);
        });

        stub(game, 'checkMove' as any).callsFake(() => {
            return new GameError(GameErrorType.InvalidWord);
        });

        expect(
            game.place(
                lettersToPlace.map((l, i) => new PlacedLetter(l, new Vec2(6 + i, 7))),
                [],
                game.activePlayer,
            ) instanceof GameError,
        ).to.equal(true);
    });

    it('place should score according to scorePosition added from the BONUS_POINTS_FOR_FULL_EASEL on correct placement with full easel placement', () => {
        game.players[activePlayer].easel = stringToLetters('abacost');
        const oldEasel = game.players[activePlayer].easel;
        const multiplierBonusOnBoard = 1;
        const wordMultiplier = 2;
        const positionsOfPlacement = oldEasel.map((l, i) => new PlacedLetter(l, new Vec2(3 + i, 7)));
        game.place(positionsOfPlacement, [], game.activePlayer);

        const thisPlayerScore = game.players[activePlayer].score;
        const expectedPoints = game.board['scorePosition'](positionsOfPlacement) as number;
        expect(thisPlayerScore).to.eq((expectedPoints + multiplierBonusOnBoard) * wordMultiplier + BONUS_POINTS_FOR_FULL_EASEL);
    });

    it('place should call verifyObjectives if log2990Objectives is not null', () => {
        game['log2990Objectives'] = new Log2990ObjectivesHandler(game);
        game.players[activePlayer].easel = stringToLetters('abacost');
        const verifyObjectivesStub = stub(game['log2990Objectives'] as Log2990ObjectivesHandler, 'verifyObjectives');
        const positionsOfPlacement = game.players[activePlayer].easel.map((l, i) => new PlacedLetter(l, new Vec2(3 + i, 7)));
        game.place(positionsOfPlacement, [], game.activePlayer);
        expect(verifyObjectivesStub.calledOnce).to.equal(true);
    });

    it('place should score according to scorePosition added from the sum of opponent easel points per letter on correct placement on endgame situation', () => {
        game.players[activePlayer].easel = stringToLetters('aa');
        const oldEasel = [...game.players[activePlayer].easel];
        game.bag.letters = [];
        game.place(
            oldEasel.map((letter, index) => new PlacedLetter(letter, new Vec2(index + 6, 7))),
            [],
            game.activePlayer,
        );

        const thisPlayerScore = game.players[activePlayer].score;

        const positionsOfPlacement = oldEasel.map((_l, i) => new PlacedLetter(oldEasel[i], new Vec2(6 + i, 7)));
        const normalScorePosition = game.board['scorePosition'](positionsOfPlacement) as number;

        const othersEasel = game.players[game.activePlayer].easel;
        const pointsArrayOfOtherEasel = othersEasel.map((l) => game.board.pointsPerLetter.get(l) as number);
        const bonusPointsFromOthersEasel = pointsArrayOfOtherEasel.reduce((sum, p) => sum + p);
        const wordMultiplier = 2;
        const expectedPoints = normalScorePosition * wordMultiplier + bonusPointsFromOthersEasel;
        expect(thisPlayerScore).to.eq(expectedPoints);
    });

    it('place should return an error if initial place is not in the center', () => {
        game.players[activePlayer].easel = stringToLetters('aa');
        const oldEasel = [...game.players[activePlayer].easel];
        expect(
            game.place(
                oldEasel.map((letter, index) => new PlacedLetter(letter, new Vec2(index + 0, 7))),
                [],
                game.activePlayer,
            ) instanceof GameError,
        ).to.equal(true);
    });

    it('draw should not return an error on correct call', () => {
        const ogActivePlayer = game.activePlayer;

        const lettersToDraw = game['getActivePlayer']().easel[0];

        expect(game.draw([lettersToDraw], game.activePlayer) instanceof GameError).to.equal(false);
        expect(game.activePlayer).to.not.eq(ogActivePlayer);
    });

    it('draw should return an error if checkMove returns an error', () => {
        stub(game, 'checkMove' as any).callsFake(() => new GameError(GameErrorType.LettersAreNotInEasel));
        expect(game.draw([game.players[game.activePlayer].easel[0]], game.activePlayer) instanceof GameError).to.equal(true);
    });

    it('skip', () => {
        const oldActivePlayer = game.activePlayer;
        game.skip(game.activePlayer);

        expect(game.activePlayer).to.not.eq(oldActivePlayer);
        expect(game['turnsSkipped']).to.eq(1);
    });

    it('skip should return an error if it is not the players turn', () => {
        const wrongAtivePlayer = (game.activePlayer + 1) % 2;
        expect(game.skip(wrongAtivePlayer) instanceof GameError).to.equal(true);
    });

    it('gameEnded should be true when one players easel is empty', () => {
        expect(game.needsToEnd()).to.eq(false);

        game.bag.letters = [];
        game.players[0].easel = [];

        expect(game.needsToEnd()).to.eq(true);
    });

    it('needsToEnd should be true when exceeding MAX_TURNS_SKIPPED', () => {
        expect(game.needsToEnd()).to.eq(false);

        game['turnsSkipped'] = 10;

        expect(game.needsToEnd()).to.eq(true);
    });

    it('needsToEnd should return false if the game is finished', () => {
        game.gameFinished = true;
        expect(game.needsToEnd()).to.eq(false);
    });

    it('endGame should always return the same as getGameEndStatus', () => {
        expect(game.endGame()).to.deep.eq(game['getGameEndStatus']());
    });

    it('endGame should only call endGameScoreAdjustment once', () => {
        const spyOnScoreAjustment = spy(game as any, 'endGameScoreAdjustment');
        game.endGame();
        game.endGame();
        expect(spyOnScoreAjustment.calledOnce).to.equal(true);
    });

    it('getGameEndStatus should return players and the winner as a string from determineWinner', () => {
        const endStatus = game['getGameEndStatus']();
        expect(endStatus.players).to.eq(game.players);
        expect(endStatus.winner).to.eq(game['determineWinner']());
    });

    it('endGameBonus should equal the opponents sum of points in easel', () => {
        const nextPlayerEasel = game['getNextPlayer']().easel;
        const pointsArrayOfNextPlayerOfEasel = nextPlayerEasel.map((l) => game.board.pointsPerLetter.get(l) as number);
        const sumOfPoints = pointsArrayOfNextPlayerOfEasel.reduce((sum, n) => sum + n);

        expect(game['endGameBonus']()).to.eq(sumOfPoints);
    });

    it('endGameScoreAdjustment should equal each players sum of points in easel', () => {
        const playersEasel = game.players.map((p) => p.easel);
        const playersPointsArrayOfEasel = playersEasel.map((easel) => easel.map((l) => game.board.pointsPerLetter.get(l) as number));
        const pointsSums = playersPointsArrayOfEasel.map((pointsArray) => pointsArray.reduce((sum, n) => sum + n));

        game['endGameScoreAdjustment']();
        game.players.forEach((player, index) => expect(player.score).to.eq(-pointsSums[index]));
    });

    it('determineWinner should return null if both players have the same amount of points', () => {
        expect(game['determineWinner']()).to.eq(null);
    });

    it('determineWinner should return highest scoring players name', () => {
        game.players[0].score++;
        expect(game['determineWinner']()).to.eq('player 1');
        game.players[1].score += 2;
        expect(game['determineWinner']()).to.eq('player 2');
    });

    it('checkMove should return an error when it is not this players turn', () => {
        expect(game['checkMove']([], game['nextPlayer']()) instanceof GameError).to.equal(true);
    });

    it('checkMove should return an error when asked letters are not in players easel', () => {
        expect(game['checkMove'](['Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z'], game.activePlayer) instanceof GameError).to.equal(true);
    });

    it('checkMove should not return an error on correct call', () => {
        const activePlayerEasel = game['getActivePlayer']().easel;
        const firstLetterOfEasel = activePlayerEasel[0];
        expect(game['checkMove']([firstLetterOfEasel], game.activePlayer) instanceof GameError).to.equal(false);
    });

    it('nextTurn should put next player in activePlayer field', () => {
        const nextPlayer = game['nextPlayer']();
        game['nextTurn']();
        expect(game.activePlayer).to.eq(nextPlayer);
    });

    it('nextPlayer should return the next players number', () => {
        const expectedResult = (game.activePlayer + 1) % game.players.length;
        expect(game['nextPlayer']()).to.eq(expectedResult);
    });

    it('getNextPlayer', () => {
        const nextPlayerNumber = game['nextPlayer']();
        expect(game['getNextPlayer']()).to.eq(game.players[nextPlayerNumber]);
    });

    it('getActivePlayer', () => {
        expect(game['getActivePlayer']()).to.eq(game.players[game.activePlayer]);
    });

    it('getGameStatus  returns specific information given to the player', () => {
        const info = game.getGameStatus(0) as any;
        expect(info.status.activePlayer).to.eq(game?.players[game?.activePlayer].name);
        expect(info.board.board).to.eq(game?.board.board);
        expect(info.board.multipliers).to.eq(game?.board.multipliers);
        expect(info.status.letterPotLength).to.eq(game?.bag.letters.length);
        expect(info.players.player).to.deep.eq(game?.players[0]);
    });

    it('getGameStatusWithUpdatedTimer returns specific information given to the player with an real time timer', () => {
        const expectedTimer = 28;
        stub(game as any, 'timeLeft').get(() => expectedTimer);
        const info = game.getGameStatus(0, BotDifficulty.Easy, true) as any;
        expect(info.status.activePlayer).to.eq(game?.players[game?.activePlayer].name);
        expect(info.board.board).to.eq(game?.board.board);
        expect(info.board.multipliers).to.eq(game?.board.multipliers);
        expect(info.status.letterPotLength).to.eq(game?.bag.letters.length);
        expect(info.status.timer).to.eq(expectedTimer);
        expect(info.players.player).to.deep.eq(game?.players[0]);
        expect(info.players.botLevel).to.eq(BotDifficulty.Easy);
    });

    it('init timer should wait the right amount of ', (done) => {
        const clk = useFakeTimers();
        game['actionAfterTimeout'] = () => {
            done();
            return undefined;
        };
        game.initTimer();
        clk.tick(gameOptions.timePerRound * MILLISECONDS_PER_SEC);
        clk.restore();
    });

    it('stop timer should not call anything after timeout', () => {
        const clk = useFakeTimers();
        const actionAfterTimeout = stub();
        game['actionAfterTimeout'] = actionAfterTimeout;
        game.initTimer();
        game.stopTimer();
        clk.tick(gameOptions.timePerRound * MILLISECONDS_PER_SEC);
        expect(actionAfterTimeout.calledOnce).to.equal(false);
        clk.restore();
    });

    it('get timeLeft should return the time left, deducing the time since the timeout started', () => {
        const timeoutStart = Date.now() - 5000;
        game['timerStartTime'] = timeoutStart;
        const expectedTime = 55;
        expect(game['timeLeft']).to.equal(expectedTime);
    });
});

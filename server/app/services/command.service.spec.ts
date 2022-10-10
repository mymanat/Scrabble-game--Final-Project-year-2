/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { GameConfig } from '@app/classes/game-config';
import { GameError, GameErrorType } from '@app/classes/game.exception';
import { Board } from '@app/classes/game/board';
import { Game, MILLISECONDS_PER_SEC } from '@app/classes/game/game';
import { Player } from '@app/classes/game/player';
import { Log2990ObjectivesHandler } from '@app/classes/log2990-objectives-handler';
import { PlacedLetter } from '@app/classes/placed-letter';
import { Room } from '@app/classes/room';
import { expect } from 'chai';
import { Dictionary } from 'common/classes/dictionary';
import { GameOptions } from 'common/classes/game-options';
import { stringToLetter } from 'common/classes/letter';
import { Vec2 } from 'common/classes/vec2';
import { BOARD_SIZE } from 'common/constants';
import { GameMode } from 'common/interfaces/game-mode';
import { Log2990Objective } from 'common/interfaces/log2990-objectives';
import { restore, stub, useFakeTimers } from 'sinon';
import io from 'socket.io';
import { Container } from 'typedi';
import { CommandService } from './command.service';
import { DictionaryService } from './dictionary.service';
import { HighscoreDatabaseService } from './highscore-database.service';
import { HistoryDatabaseService } from './history-database.service';
import { RoomsManager } from './rooms-manager.service';

describe('Individual functions', () => {
    let sockets: io.Socket[];
    let commandService: CommandService;
    const gameConfig: GameConfig = new GameConfig('gameConfig', [], new Vec2(BOARD_SIZE, BOARD_SIZE));
    const gameOptions: GameOptions = new GameOptions('host', 'dict', GameMode.Classical, 60);
    const dicService = Container.get(DictionaryService);
    dicService.init();
    const dictionary = dicService.getDictionary('Francais') as Dictionary;

    const createFakeSocket = (index: number) => {
        return {
            on: () => {
                return;
            },
            id: '1',
            emit: () => {
                return;
            },
            removeAllListeners: () => {
                return sockets[index];
            },
        } as unknown as io.Socket;
    };

    beforeEach(() => {
        commandService = new CommandService(Container.get(DictionaryService));
        sockets = [];
        sockets.push(createFakeSocket(0));
        sockets.push(createFakeSocket(1));
    });

    it('onCommand should call processCommand', async () => {
        const processStub = stub(commandService as any, 'processCommand').callsFake(() => {
            return;
        });

        const game = {
            needsToEnd: () => false,
        } as unknown as Game;

        await commandService.onCommand(game, sockets, 'passer', 0);
        expect(processStub.calledOnce).to.equal(true);
    });

    it('onCommand should call errorOnCommand if an error was returned and gameEnded if game exists', async () => {
        const processStub = stub(commandService, 'processCommand' as any).callsFake(() => {
            return new Error('Error de test');
        });
        const errorOnCommandStub = stub(commandService as any, 'errorOnCommand').callsFake(() => {
            return;
        });

        let gameEndedCalled = false;
        const game = {
            needsToEnd: () => {
                gameEndedCalled = true;
                return false;
            },
        } as unknown as Game;

        await commandService.onCommand(game, sockets, 'passer', 0);

        expect(processStub.calledOnce && gameEndedCalled && errorOnCommandStub.calledOnce).to.equal(true);
    });

    it('actionAfterTimeout should call processSkip', async () => {
        const skipStub = stub(commandService as any, 'processSkip');
        const postCommandStub = stub(commandService, 'postCommand' as any);
        const fakeGame = {
            activePlayer: 0,
            needsToEnd: () => false,
        } as unknown as Game;
        const roomStub = { game: fakeGame, commandService } as unknown as Room;

        commandService['actionAfterTimeout'](roomStub)();
        expect(skipStub.calledOnce).to.equal(true);
        expect(postCommandStub.calledOnce).to.equal(true);
    });

    it('onCommand should call emit end game if gameEnded returns true', (done) => {
        const dataStub = stub(Container.get(HighscoreDatabaseService), 'updateHighScore').callsFake(async () => {
            return;
        });
        sockets[0] = {
            emit: (event: string) => {
                expect(event === 'end game').to.equal(true);
                expect(processStub.calledOnce && errorOnCommandStub.calledOnce).to.equal(true);
                expect(dataStub.called).to.equal(true);
                restore();
                done();
                return;
            },
        } as unknown as io.Socket;

        const processStub = stub(commandService, 'processCommand' as any).callsFake(() => {
            return new Error('Error de test');
        });
        const errorOnCommandStub = stub(commandService as any, 'errorOnCommand').callsFake(() => {
            return;
        });

        const game = {
            players: [{ name: 'player', score: 5 }],
            needsToEnd: () => {
                return true;
            },
            endGame: () => {
                return {
                    toEndGameStatus: () => {
                        return;
                    },
                };
            },
        } as unknown as Game;

        commandService.onCommand(game, sockets, 'passer', 0);
    });

    it('validate place validates correct arguments with one single letter placement', () => {
        let commandArgs = ['i7h', 'c'];
        expect(commandService['validatePlace'](gameConfig, commandArgs)).to.eq(true);
        commandArgs = ['i7v', 'c'];
        expect(commandService['validatePlace'](gameConfig, commandArgs)).to.eq(true);
        commandArgs = ['i7', 'c'];
        expect(commandService['validatePlace'](gameConfig, commandArgs)).to.eq(true);
    });

    it('validate place validates correct arguments', () => {
        let commandArgs = ['h7h', 'con'];
        expect(commandService['validatePlace'](gameConfig, commandArgs)).to.eq(true);
        commandArgs = ['h11h', 'con'];
        expect(commandService['validatePlace'](gameConfig, commandArgs)).to.eq(true);
    });

    it('parse place call returns the right placed characters', () => {
        const game = { board: new Board(gameConfig, dictionary) } as unknown as Game;
        const commandArgs = ['h7h', 'con'];
        const placedLetters = commandService['parsePlaceCall'](game, commandArgs);
        placedLetters[0].forEach((l, index) => {
            expect(l).to.deep.eq(new PlacedLetter(stringToLetter(commandArgs[1][index]), new Vec2(6 + index, 7)));
        });
    });

    it('endGame should send highScores with Log2990 GameMode', () => {
        const dataStub = stub(Container.get(HighscoreDatabaseService), 'updateHighScore').callsFake(async () => {
            return;
        });
        const gameHistoryStub = stub(Container.get(HistoryDatabaseService), 'addGameHistory').callsFake(async () => {
            return;
        });
        const fakeGame = {
            log2990Objectives: {},
            players: [{} as Player],
            gameHistory: {
                createGameHistoryData: () => {
                    return;
                },
            },
            endGame: () => {
                return {
                    toEndGameStatus: () => {
                        return;
                    },
                };
            },
        } as unknown as Game;
        const fakeSocket = {
            emit: () => {
                return;
            },
        } as unknown as io.Socket;
        sockets = [fakeSocket];
        const responseTime = 200;
        commandService['endGame'](fakeGame, sockets);
        setTimeout(() => {
            expect(dataStub.calledOnce).to.equal(true);
            expect(gameHistoryStub.called).to.equal(true);
        }, responseTime);
    });

    it('parse place call returns the right placed characters vertical edition', () => {
        const game = { board: new Board(gameConfig, dictionary) } as unknown as Game;
        const commandArgs = ['g8v', 'con'];
        const placedLetters = commandService['parsePlaceCall'](game, commandArgs);
        placedLetters[0].forEach((l, index) => {
            expect(l).to.deep.eq(new PlacedLetter(stringToLetter(commandArgs[1][index]), new Vec2(7, 6 + index)));
        });
    });

    it('errorCommand should start a timer and call postCommand', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                expect(event).to.equal('error');
            },
        } as unknown as io.Socket;
        const game = {
            stopTimer: () => {
                return;
            },
            nextTurn: () => {
                return;
            },
            gameOptions,
        } as unknown as Game;
        const clk = useFakeTimers();
        const playerNumber = 0;
        sockets = [fakeSocket];
        commandService['postCommand'] = () => done();
        commandService['errorOnCommand'](game, sockets, new GameError(GameErrorType.InvalidWord), playerNumber);
        clk.tick(game['gameOptions'].timePerRound * MILLISECONDS_PER_SEC);
        clk.restore();
    });

    it('errorCommand should start a timer and call emit from opponent', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                expect(event).to.equal('error');
            },
        } as unknown as io.Socket;
        const fakeOpponent = {
            emit: (event: string, message: { username: string; message: string; messageType: string }) => {
                expect(message.message).to.equal("L'adversaire a placé un mot invalide");
                expect(event).to.equal('receive message');
            },
        } as unknown as io.Socket;
        const game = {
            stopTimer: () => {
                return;
            },
            nextTurn: () => {
                return;
            },
            gameOptions,
        } as unknown as Game;
        const clk = useFakeTimers();
        const playerNumber = 1;
        sockets[playerNumber] = fakeSocket;
        sockets[(playerNumber + 1) % 2] = fakeOpponent;
        commandService['postCommand'] = () => done();
        commandService['errorOnCommand'](game, sockets, new GameError(GameErrorType.InvalidWord), playerNumber);
        clk.tick(game['gameOptions'].timePerRound * MILLISECONDS_PER_SEC);
        clk.restore();
    });

    it('errorOnCommand should emit error', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                expect(event).to.equal('error');
                done();
            },
        } as unknown as io.Socket;
        const game = {} as unknown as Game;
        const playerNumber = 0;
        sockets[playerNumber] = fakeSocket;
        commandService['errorOnCommand'](game, sockets, new Error('error'), playerNumber);
    });

    it('errorOnCommand should not emit error if the socket does not contain corresponding socket', (done) => {
        let emitWasCalled = false;
        const fakeSocket = {
            emit: () => {
                emitWasCalled = true;
            },
        } as unknown as io.Socket;
        const game = {} as unknown as Game;
        const playerNumber = 0;
        sockets[playerNumber] = fakeSocket;
        commandService['errorOnCommand'](game, sockets, new Error('error'), 3);
        const responseTime = 200;
        setTimeout(() => {
            expect(emitWasCalled).to.equal(false);
            done();
        }, responseTime);
    });
});

describe('commands', () => {
    let commandService: CommandService;
    let room: Room;
    let sockets: io.Socket[];
    let gameOptions: GameOptions;
    let game: Game;

    const createFakeSocket = (index: number) => {
        return {
            once: () => {
                return;
            },
            on: () => {
                return;
            },
            id: '1',
            emit: () => {
                return;
            },
            removeAllListeners: () => {
                return sockets[index];
            },
        } as unknown as io.Socket;
    };

    beforeEach(() => {
        sockets = [];
        sockets.push(createFakeSocket(0));
        sockets.push(createFakeSocket(1));

        gameOptions = new GameOptions('a', 'Francais', GameMode.Classical);
        commandService = new CommandService(Container.get(DictionaryService));

        room = new Room(sockets[0], Container.get(RoomsManager), gameOptions);
        room.join(sockets[1], 'player 2');
        room['inviteAccepted'](sockets[1]);
        game = room.game as Game;
    });

    it('post command emits turn ended', (done) => {
        room.sockets.pop();
        room.sockets[0].emit = (namespace: string): boolean => {
            if (namespace === 'turn ended') done();
            return true;
        };
        commandService['postCommand'](game, room.sockets);
    });

    it('post command emits log2990 objectives if gameMode is LOG2990', (done) => {
        room.sockets.pop();
        game.log2990Objectives = new Log2990ObjectivesHandler(game);
        stub(game.log2990Objectives, 'retrieveLog2990Objective').callsFake(() => [
            {} as Log2990Objective,
            {} as Log2990Objective,
            {} as Log2990Objective,
        ]);
        room.sockets[0].emit = (namespace: string): boolean => {
            if (namespace === 'log2990 objectives') done();
            return true;
        };
        commandService['postCommand'](game, room.sockets);
    });

    describe('process command', () => {
        it('string with place calls processPlace', async () => {
            const processPlaceStub = stub(commandService, 'processPlace' as any);
            const postCommandStub = stub(commandService, 'postCommand' as any);
            const fullCommand = 'placer h3h h';
            await commandService['processCommand'](game, room.sockets, fullCommand, game.activePlayer);
            expect(processPlaceStub.calledOnce);
            expect(postCommandStub.calledOnce);
        });

        it('string with draw calls processDraw', async () => {
            const processDrawStub = stub(commandService, 'processDraw' as any);
            const postCommandStub = stub(commandService, 'postCommand' as any);
            const fullCommand = 'échanger abc';
            await commandService['processCommand'](game, room.sockets, fullCommand, game.activePlayer);
            expect(processDrawStub.calledOnce);
            expect(postCommandStub.calledOnce);
        });

        it('string with skip calls processSkip', async () => {
            const processSkipStub = stub(commandService, 'processSkip' as any);
            const postCommandStub = stub(commandService, 'postCommand' as any);
            const fullCommand = 'passer';
            await commandService['processCommand'](game, room.sockets, fullCommand, game.activePlayer);
            expect(processSkipStub.calledOnce);
            expect(postCommandStub.calledOnce);
        });

        it('string with place calls processPlace', async () => {
            const postCommandStub = stub(commandService, 'postCommand' as any);
            const fullCommand = 'placer h3h h';
            game.gameFinished = true;
            expect((await commandService['processCommand'](game, room.sockets, fullCommand, game.activePlayer)) instanceof GameError).to.equal(true);
            expect(postCommandStub.notCalled);
        });

        it('string with skip calls processBag', async () => {
            const processBagStub = stub(commandService, 'processBag' as any);
            const postCommandStub = stub(commandService, 'postCommand' as any);
            const fullCommand = 'réserve';
            await commandService['processCommand'](game, room.sockets, fullCommand, game.activePlayer);
            expect(processBagStub.calledOnce);
            expect(postCommandStub.notCalled);
        });

        it('string with hint calls processHint', async () => {
            const processHintStub = stub(commandService, 'processHint' as any);
            const postCommandStub = stub(commandService, 'postCommand' as any);
            const fullCommand = 'indice';
            await commandService['processCommand'](game, room.sockets, fullCommand, game.activePlayer);
            expect(processHintStub.calledOnce);
            expect(postCommandStub.notCalled);
        });
    });

    it('process place calls game place on correctly formed arguments', (done) => {
        game.place = () => {
            done();
            return undefined;
        };
        const commandArgs = ['h7h', 'con'];
        commandService['processPlace'](game, room.sockets, commandArgs, game.activePlayer);
    });

    it('processPlace not valid should emit an Error', () => {
        commandService['validatePlace'] = () => {
            return false;
        };
        expect(commandService['processPlace'](game, room.sockets, ['a'], 0) instanceof GameError).to.equal(true);
    });

    it('processPlace should return an Error if game.place returns an error', () => {
        stub(game, 'place').callsFake(() => new GameError(GameErrorType.BadStartingMove));
        const commandArgs = ['h7h', 'con'];
        expect(commandService['processPlace'](game, room.sockets, commandArgs, game.activePlayer) instanceof GameError).to.equal(true);
    });

    it('processDraw with wrong arguments should return an error', () => {
        expect(commandService['processDraw'](game, room.sockets, ['a8'], 0) instanceof GameError).to.equal(true);
    });

    it('processSkip with arguments should return an error', () => {
        expect(commandService['processSkip'](game, room.sockets, ['a', 'b'], 0) instanceof GameError).to.equal(true);
    });

    it('processHint with arguments should return an error', async () => {
        expect((await commandService['processHint'](game, room.sockets, ['a', 'b'], 0)) instanceof GameError).to.equal(true);
    });

    it('ProcessSkip should emit skip success when player number is 0', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                if (event === 'skip success') done();
                return;
            },
        } as io.Socket;
        room.sockets[0] = fakeSocket;
        stub(room.game as any, 'skip').callsFake(() => {
            return;
        });
        commandService['processSkip'](game, room.sockets, [], 0);
    });

    it('processHint should emit hint success', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                if (event === 'hint success') done();
                return;
            },
        } as io.Socket;
        room.sockets[0] = fakeSocket;
        commandService['processHint'](game, room.sockets, [], 0);
    });

    it('ProcessSkip should emit skip success when player number is 1', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                if (event === 'skip success') done();
                return;
            },
        } as io.Socket;
        room.sockets[1] = fakeSocket;
        stub(game as any, 'skip').callsFake(() => {
            return;
        });
        commandService['processSkip'](game, room.sockets, [], 1);
    });

    it('processPlace should emit place success playerNumber is 1', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                if (event === 'place success') done();
                return;
            },
        } as io.Socket;
        room.sockets = [fakeSocket];
        stub(commandService as any, 'parsePlaceCall').callsFake(() => {
            return ['a', 'b'];
        });
        stub(room.game as any, 'place').callsFake(() => {
            return;
        });
        stub(commandService as any, 'validatePlace').callsFake(() => {
            return true;
        });
        commandService['processPlace'](game, room.sockets, [], 1);
    });

    it('processPlace should emit place success when playerNumber is 0', (done) => {
        const fakeSocket = {
            emit: (event: string) => {
                if (event === 'place success') done();
                return;
            },
        } as io.Socket;
        room.sockets = [fakeSocket];
        stub(commandService as any, 'parsePlaceCall').callsFake(() => {
            return ['a', 'b'];
        });
        stub(room.game as any, 'place').callsFake(() => {
            return;
        });
        stub(commandService as any, 'validatePlace').callsFake(() => {
            return true;
        });
        commandService['processPlace'](game, room.sockets, [], 0);
    });

    it('validatePlace should return false if there is not two arguments', () => {
        expect(commandService['validatePlace'](game.config, ['a'])).to.equal(false);
    });

    it('validatePlace should return false if there is not two arguments', () => {
        const result = commandService['parsePlaceCall'](game, ['h7h', 'Ab']);
        expect(result[1].length).to.equal(1);
    });

    it('process draw calls game draw on correctly formed arguments', (done) => {
        game.draw = () => {
            done();
            return undefined;
        };
        commandService['processDraw'](game, room.sockets, ['a'], 0);
    });

    it('process draw calls game draw on correctly formed arguments with another player number', (done) => {
        game.draw = () => {
            done();
            return undefined;
        };
        commandService['processDraw'](game, room.sockets, ['a'], 1);
    });

    it('process skip calls game skip on correctly formed arguments', (done) => {
        game.skip = () => {
            done();
            return undefined;
        };
        commandService['processSkip'](game, room.sockets, [], game.activePlayer);
    });

    it('process bag calls game emits on correctly formed arguments', (done) => {
        room.sockets[0].emit = (): boolean => {
            done();
            return true;
        };
        commandService['processBag'](game, room.sockets, [], 0);
    });
});

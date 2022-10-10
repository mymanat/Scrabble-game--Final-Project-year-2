/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable dot-notation */
import { Room } from '@app/classes/room';
import { PORT, RESPONSE_DELAY } from '@app/environnement';
import { BotDifficulty, BotService } from '@app/services/bot.service';
import { HighscoreDatabaseService } from '@app/services/highscore-database.service';
import { HistoryDatabaseService } from '@app/services/history-database.service';
import { RoomsManager } from '@app/services/rooms-manager.service';
import { expect } from 'chai';
import { GameOptions } from 'common/classes/game-options';
import { MIN_BOT_PLACEMENT_TIME, SECONDS_IN_MINUTE } from 'common/constants';
import { GameMode } from 'common/interfaces/game-mode';
import { Log2990Objective } from 'common/interfaces/log2990-objectives';
import { createServer, Server } from 'http';
import { createStubInstance, restore, SinonStub, SinonStubbedInstance, stub, useFakeTimers } from 'sinon';
import io from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { GameError, GameErrorType } from './game.exception';
import { Game } from './game/game';
import { Log2990ObjectivesHandler } from './log2990-objectives-handler';

describe('room', () => {
    let roomsManager: SinonStubbedInstance<RoomsManager>;
    beforeEach(() => {
        roomsManager = createStubInstance(RoomsManager);
    });
    afterEach(() => {
        restore();
    });

    describe('Individual functions', () => {
        let socket: io.Socket;
        let gameOptions: GameOptions;
        beforeEach(() => {
            socket = {
                once: () => {
                    return;
                },
                id: '1',
                emit: () => {
                    return;
                },
                removeAllListeners: () => {
                    return socket;
                },
            } as unknown as io.Socket;
            gameOptions = new GameOptions('player1', 'b', GameMode.Classical, SECONDS_IN_MINUTE);
        });

        it('constructor should create a Room', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            expect(room.clients.length).to.eq(1);
            expect(room['gameOptions']).to.eq(gameOptions);
            expect(room.host).to.eq(socket);
            expect(room.started).to.eq(false);
            socket.emit('quit');
        });

        it('quitRoomHost should call RoomsManager.removeRoom', (done) => {
            roomsManager.removeRoom.callsFake(() => done());
            const room = new Room(socket, roomsManager, gameOptions);
            room.quitRoomHost();
        });

        it('quitRoomHost should call RoomsManager.removeRoom', (done) => {
            const room = new Room(socket, roomsManager, gameOptions);
            room.clients[0] = { id: '1' } as unknown as io.Socket;
            stub(room, 'inviteRefused' as any).callsFake(() => {
                return done();
            });
            room.quitRoomHost();
        });

        it('inviteRefused should set remove the client from the room', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            room.clients[0] = socket;
            room['inviteRefused'](socket);
            expect(room.clients[0]).to.deep.equal(null);
        });

        it('quitRoomClient should call RoomsManager.removeRoom', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            room.clients[0] = socket;
            room.quitRoomClient();
            expect(room.clients[0]).to.equal(null);
        });

        it('join should add the client to the clients list', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            room.join(socket, 'Player 2');
            expect(room.clients[0]).to.deep.equal(socket);
        });

        it('surrenderGame should return error if the game is null', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            expect(room.surrenderGame(socket.id) instanceof GameError).to.equal(true);
        });

        it('initiateRoomEvents should call setupSocket', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            const setupSocketStub = stub(room as any, 'setupSocket').callsFake(() => {
                return;
            });
            room.clients[0] = {} as io.Socket;
            room.initiateRoomEvents();
            expect(setupSocketStub.called).to.equal(true);
        });

        it('initiateRoomEvents should call setupSocket once if no client is present', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            const setupSocketStub = stub(room as any, 'setupSocket').callsFake(() => {
                return;
            });
            room.initiateRoomEvents();
            expect(setupSocketStub.calledOnce).to.equal(true);
        });

        it('initSoloGame should put the correct attributes and call notifyAvailableRoomsChanges and setupSocket', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            const setUpSocketStub = stub(room as any, 'setupSocket');
            room.initSoloGame(BotDifficulty.Easy);
            expect(roomsManager.notifyAvailableRoomsChange.calledOnce).to.equal(true);
            expect(setUpSocketStub.calledOnce).to.equal(true);
            expect(room.sockets.length).to.equal(1);
            expect(room.sockets.includes(socket)).to.equal(true);
        });

        it('removeUnneededListeners should remove the listeners that are going to be reinstated', () => {
            const room = new Room(socket, roomsManager, gameOptions);
            const socketStub = stub(socket, 'removeAllListeners').callThrough();
            room.removeUnneededListeners(socket);
            expect(socketStub.calledWith('send message')).to.equal(true);
            expect(socketStub.calledWith('surrender game')).to.equal(true);
            expect(socketStub.calledWith('get game status')).to.equal(true);
        });

        it('actionAfterTurnWithBot should not call move from botService if the game has ended', async () => {
            const room = new Room(socket, roomsManager, gameOptions);
            const stubbedGame = {
                activePlayer: 0,
                gameFinished: true,
            } as unknown as Game;
            const moveStub = stub(Container.get(BotService), 'move').callsFake(async () => {
                return '';
            });
            room.game = stubbedGame;
            await room['actionAfterTurnWithBot'](room, BotDifficulty.Easy)();
            expect(moveStub.called).to.equal(false);
        });

        it('actionAfterTurnWithBot should return an error if the botservice return an error', async () => {
            const room = new Room(socket, roomsManager, gameOptions);
            stub(Container.get(BotService), 'move').callsFake(async () => {
                return new GameError(GameErrorType.OutOfBoundPosition);
            });
            const stubbedGame = {
                activePlayer: 1,
                gameFinished: false,
            } as unknown as Game;
            room.game = stubbedGame;
            expect((await room['actionAfterTurnWithBot'](room, BotDifficulty.Easy)()) instanceof GameError).to.equal(true);
        });

        describe('Functions Needing fake games', () => {
            let fakeGame: Game;
            let room: Room;

            beforeEach(() => {
                fakeGame = {
                    players: [{ name: 'player1' }, { name: 'player2' }],
                    board: { getRandomWord: () => 'abc' },
                    bag: { letters: [] },
                    gameHistory: {
                        createGameHistoryData: () => {
                            return;
                        },
                    },
                    activePlayer: 1,
                    gameFinished: false,
                    stopTimer: () => {
                        return;
                    },
                    endGame: () => {
                        return;
                    },
                    skip: () => {
                        return;
                    },
                    getGameStatus: () => {
                        return;
                    },
                    needsToEnd: () => true,
                } as unknown as Game;
                room = new Room(socket, roomsManager, gameOptions);
                room.game = fakeGame;
            });

            it('convertToSolo should emit receive message and game status with a bot as second player and reset event listeners', (done) => {
                const removeEventStub = stub(room, 'removeUnneededListeners');
                const setupSocketStub = stub(room as any, 'setupSocket');
                const otherSocket = {} as io.Socket;
                const emitStub = stub(socket, 'emit');
                room.sockets = [socket, otherSocket];
                room['convertToSolo'](1);
                setTimeout(() => {
                    expect(emitStub.calledTwice).to.equal(true);
                    expect(removeEventStub.calledOnce).to.equal(true);
                    expect(setupSocketStub.calledOnce).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });

            it('convertToSolo should switch client to be host if host surrenders and reset event listeners', (done) => {
                const removeEventStub = stub(room, 'removeUnneededListeners');
                const setupSocketStub = stub(room as any, 'setupSocket');
                const otherSocket = {} as io.Socket;
                room.sockets = [otherSocket, socket];
                room['convertToSolo'](0);
                setTimeout(() => {
                    expect(removeEventStub.calledOnce).to.equal(true);
                    expect(setupSocketStub.calledOnce).to.equal(true);
                    expect(room.game?.players[0].name).to.equal('player2');
                    done();
                }, RESPONSE_DELAY);
            });

            it('convertToSolo should switch client to be host if host surrenders and reset event listeners if Gamemode is Classical', (done) => {
                const removeEventStub = stub(room, 'removeUnneededListeners');
                const setupSocketStub = stub(room as any, 'setupSocket');
                fakeGame.log2990Objectives = {
                    switchingPlayersObjectives: () => {
                        return;
                    },
                } as Log2990ObjectivesHandler;
                room.game = fakeGame;
                const otherSocket = {} as io.Socket;
                room.sockets = [otherSocket, socket];
                room['convertToSolo'](0);
                setTimeout(() => {
                    expect(removeEventStub.calledOnce).to.equal(true);
                    expect(setupSocketStub.calledOnce).to.equal(true);
                    expect(room.game?.players[0].name).to.equal('player2');
                    done();
                }, RESPONSE_DELAY);
            });

            it('sendObjectives should emit log2990 objectives and call retrieveLog2990Objective if gameMode is Log2990', (done) => {
                room.game = fakeGame;
                room.game.log2990Objectives = new Log2990ObjectivesHandler(fakeGame);
                const retrieveLog2990ObjectiveStub = stub(room.game.log2990Objectives, 'retrieveLog2990Objective').callsFake(() => [
                    {} as Log2990Objective,
                ]);
                const emitStub = stub(socket, 'emit');
                room.sockets = [socket];
                room['sendObjectives']();
                setTimeout(() => {
                    expect(emitStub.calledOnce).to.equal(true);
                    expect(retrieveLog2990ObjectiveStub.calledOnce).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });

            it('surrenderGame should emit endGame if the game is not null and not call gameHistory if gameFinished is true', (done) => {
                const dataStub = stub(Container.get(HighscoreDatabaseService), 'updateHighScore').callsFake(async () => {
                    return;
                });
                const gameHistoryStub = stub(Container.get(HistoryDatabaseService), 'addGameHistory').callsFake(async () => {
                    return;
                });
                let clientReceived = false;
                const clientSocket = {
                    emit: () => {
                        clientReceived = true;
                    },
                } as unknown as io.Socket;
                let hostReceived = false;
                const hostSocket = {
                    emit: () => {
                        hostReceived = true;
                    },
                } as unknown as io.Socket;
                room['botLevel'] = BotDifficulty.Easy;
                room.sockets = [clientSocket, hostSocket];
                fakeGame.gameFinished = true;
                room.game = fakeGame;
                room.surrenderGame(socket.id);
                room.surrenderGame('player2');
                setTimeout(() => {
                    expect(clientReceived && hostReceived).to.deep.equal(true);
                    expect(dataStub.called).to.equal(true);
                    expect(gameHistoryStub.called).to.equal(false);
                    done();
                }, RESPONSE_DELAY * 3);
            });

            it('surrenderGame should emit endGame if the game is not null and call dataBase with Log2990 gameMode', (done) => {
                const dataStub = stub(Container.get(HighscoreDatabaseService), 'updateHighScore').callsFake(async () => {
                    return;
                });
                const gameHistoryStub = stub(Container.get(HistoryDatabaseService), 'addGameHistory').callsFake(async () => {
                    return;
                });
                let clientReceived = false;
                const clientSocket = {
                    emit: () => {
                        clientReceived = true;
                    },
                } as unknown as io.Socket;
                let hostReceived = false;
                const hostSocket = {
                    emit: () => {
                        hostReceived = true;
                    },
                } as unknown as io.Socket;
                fakeGame.log2990Objectives = {} as Log2990ObjectivesHandler;
                room.game = fakeGame;
                room['botLevel'] = BotDifficulty.Easy;
                room.sockets = [clientSocket, hostSocket];
                room.surrenderGame(socket.id);
                room.surrenderGame('player2');
                setTimeout(() => {
                    expect(clientReceived && hostReceived).to.deep.equal(true);
                    expect(dataStub.called).to.equal(true);
                    expect(gameHistoryStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY * 3);
            });

            it('surrenderGame should call RoomsManager.removeRoom if no players are left', () => {
                const gameHistoryStub = stub(Container.get(HistoryDatabaseService), 'addGameHistory').callsFake(async () => {
                    return;
                });
                room['playersLeft'] = 0;
                room['botLevel'] = BotDifficulty.Easy;
                room.sockets = [];
                room.surrenderGame('socket id');
                expect(roomsManager.removeRoom.calledOnce).to.equal(true);
                expect(gameHistoryStub.called).to.equal(true);
            });

            it('surrenderGame should call convertToSolo if botLevel undefined with 0 if host surrenders', () => {
                const convertToSoloStub = stub(room as any, 'convertToSolo');
                room['botLevel'] = undefined;
                room.surrenderGame(socket.id);
                expect(convertToSoloStub.calledOnceWith(0)).to.equal(true);
            });

            it('surrenderGame should call convertToSolo if botLevel undefined with 1 if client surrenders', () => {
                const convertToSoloStub = stub(room as any, 'convertToSolo');
                room['botLevel'] = undefined;
                room.surrenderGame('client id');
                expect(convertToSoloStub.calledOnceWith(1)).to.equal(true);
            });

            it('quitRoomClient should not emit if game is not null', () => {
                const emitStub = stub(socket, 'emit').callsFake(() => {
                    return true;
                });
                room.quitRoomClient();
                expect(emitStub.called).to.equal(false);
            });

            it('actionAfterTimeout should call end game if game is ended', () => {
                stub(room.commandService, 'processSkip' as any).callsFake(() => {
                    return;
                });
                stub(room.commandService, 'postCommand' as any).callsFake(() => {
                    return;
                });
                const endGame = stub(room.commandService, 'endGame' as any);
                room['actionAfterTimeout']()();
                expect(endGame.calledOnce).to.equal(true);
            });

            it('actionAfterTurnWithBot should call move from botService if it is the bot turn', async () => {
                const moveStub = stub(Container.get(BotService), 'move').callsFake(async () => {
                    return '';
                });
                const onCommandStub = stub(room.commandService, 'onCommand');
                const clk = useFakeTimers();
                await room['actionAfterTurnWithBot'](room, BotDifficulty.Easy)();
                clk.tick(MIN_BOT_PLACEMENT_TIME);
                clk.restore();
                expect(onCommandStub.calledOnce).to.equal(true);
                expect(moveStub.calledOnce).to.equal(true);
            });

            it('actionAfterTurnWithBot should not call move from botService if it is not the bot turn', async () => {
                const moveStub = stub(Container.get(BotService), 'move').callsFake(async () => {
                    return '';
                });
                fakeGame.activePlayer = 0;
                room.game = fakeGame;
                await room['actionAfterTurnWithBot'](room, BotDifficulty.Easy)();
                expect(moveStub.called).to.equal(false);
            });
        });
    });

    describe('Room events', () => {
        let hostSocket: Socket;
        let clientSocket: Socket;
        let server: io.Server;
        let httpServer: Server;

        before((done) => {
            httpServer = createServer();
            httpServer.listen(PORT);
            server = new io.Server(httpServer);
            httpServer.on('listening', () => done());
        });

        beforeEach(() => {
            hostSocket = Client('http://localhost:3000');
            clientSocket = Client('http://localhost:3000');
        });

        afterEach(() => {
            restore();
            server.removeAllListeners();
        });

        after(() => {
            server.close();
            httpServer.close();
        });

        describe('Emitting', () => {
            let room: Room;

            beforeEach(() => {
                const gameOptions = new GameOptions('a', 'b', GameMode.Classical, 60);
                server.on('connection', (socket) => {
                    socket.on('create room', () => {
                        room = new Room(socket, roomsManager, gameOptions);
                        clientSocket.emit('join');
                    });
                    socket.on('join', () => {
                        room.join(socket, 'player 2');
                    });
                });
            });

            it('join emits player joining event', (done) => {
                hostSocket.on('player joining', (name) => {
                    expect(name).to.eq('player 2');
                    done();
                });
                hostSocket.emit('create room');
            });

            it('client should receive refused if host refuses', (done) => {
                hostSocket.on('player joining', () => {
                    hostSocket.emit('refuse');
                });
                clientSocket.on('refused', () => {
                    expect(room.clients[0]).to.eq(null);
                    done();
                });
                hostSocket.emit('create room');
            });

            it('client should receive accepted if host accepts', (done) => {
                hostSocket.on('player joining', () => {
                    hostSocket.emit('accept');
                });
                clientSocket.on('accepted', () => {
                    done();
                });
                hostSocket.emit('create room');
            });

            it('client should receive message if host emits send message', (done) => {
                const message = { username: 'Hostname', message: 'Host Message', messageType: '' };
                hostSocket.on('player joining', () => {
                    hostSocket.emit('accept');
                    hostSocket.emit('send message', message);
                });
                clientSocket.on('receive message', (data) => {
                    expect(data.username).to.equal(message.username);
                    expect(data.message).to.equal(message.message);
                    done();
                });
                hostSocket.emit('create room');
            });

            it('host should receive message if client emits send message', (done) => {
                const message = { username: 'ClientName', message: 'Client Message', messageType: '' };
                hostSocket.on('player joining', () => {
                    hostSocket.emit('accept');
                    clientSocket.emit('send message', message);
                });
                hostSocket.on('receive message', (data) => {
                    expect(data.username).to.equal(message.username);
                    expect(data.message).to.equal(message.message);
                    done();
                });
                hostSocket.emit('create room');
            });

            it('should call removeRoom if no players are left when quit message sent', (done) => {
                const message = { username: '', message: 'Player1 a quitté le jeu', messageType: 'System' };
                hostSocket.on('player joining', () => {
                    room['playersLeft'] = 1;
                    hostSocket.emit('accept');
                    clientSocket.emit('send message', message);
                });
                hostSocket.on('receive message', () => {
                    setTimeout(() => {
                        expect(roomsManager.removeRoom.calledOnce).to.equal(true);
                        done();
                    }, RESPONSE_DELAY);
                });
                hostSocket.emit('create room');
            });

            it('should not call removeRoom if players are left when quit message sent', (done) => {
                const message = { username: '', message: 'Player1 a quitté le jeu', messageType: 'System' };
                hostSocket.on('player joining', () => {
                    room['playersLeft'] = 2;
                    hostSocket.emit('accept');
                    clientSocket.emit('send message', message);
                });
                setTimeout(() => {
                    expect(roomsManager.removeRoom.calledOnce).to.equal(false);
                    done();
                }, RESPONSE_DELAY);
                hostSocket.emit('create room');
            });

            it('setUpSocket should enable the surrender event which calls surrenderGame', (done) => {
                let surrenderGameStub: SinonStub;
                hostSocket.on('player joining', () => {
                    surrenderGameStub = stub(room, 'surrenderGame').callsFake(() => {
                        return undefined;
                    });
                    hostSocket.emit('accept');
                });
                clientSocket.on('accepted', () => {
                    hostSocket.emit('surrender game');
                });
                hostSocket.emit('create room');
                setTimeout(() => {
                    expect(surrenderGameStub.called).to.equal(true);
                    surrenderGameStub.restore();
                    done();
                }, RESPONSE_DELAY);
            });
        });

        describe('getGameInfo', () => {
            it('client should receive game info when requested', (done) => {
                let room: Room;
                const gameOptions = new GameOptions('a', 'b', GameMode.Classical, SECONDS_IN_MINUTE);
                server.on('connection', (socket) => {
                    socket.on('create room', () => {
                        room = new Room(socket, roomsManager, gameOptions);
                        clientSocket.emit('join');
                    });
                    socket.on('join', () => {
                        room.join(socket, 'player 2');
                    });
                });

                clientSocket.on('accepted', () => {
                    clientSocket.emit('get game status');
                });
                hostSocket.on('player joining', () => {
                    hostSocket.emit('accept');
                });
                clientSocket.on('game status', () => {
                    done();
                });
                hostSocket.emit('create room');
            });
        });

        describe('Receiving', () => {
            it('quit should call quitRoomHost() when emitted', (done) => {
                const gameOptions = new GameOptions('player 1', 'b', GameMode.Classical, SECONDS_IN_MINUTE);
                server.on('connection', (socket) => {
                    socket.on('create room', () => {
                        const room = new Room(socket, roomsManager, gameOptions);
                        const quitRoomHostStub = stub(room, 'quitRoomHost');
                        hostSocket.emit('quit');
                        setTimeout(() => {
                            expect(quitRoomHostStub.calledOnce).to.deep.equal(true);
                            done();
                        }, RESPONSE_DELAY);
                    });
                });
                hostSocket.emit('create room');
            });

            it('switch to solo room should call initSoloGame when emitted and emit switched to solo', (done) => {
                const gameOptions = new GameOptions('player 1', 'b', GameMode.Classical, SECONDS_IN_MINUTE);
                server.on('connection', (socket) => {
                    socket.on('create room', () => {
                        const room = new Room(socket, roomsManager, gameOptions);
                        const initSoloGameStub = stub(room, 'initSoloGame');
                        hostSocket.on('switched to solo', () => {
                            expect(initSoloGameStub.calledOnce).to.equal(true);
                            done();
                        });
                        hostSocket.emit('switch to solo room', { botLevel: 'Débutant' });
                    });
                });
                hostSocket.emit('create room');
            });

            it('accept should call inviteAccepted()', (done) => {
                let room: Room;
                const gameOptions = new GameOptions('player 1', 'b', GameMode.Classical, SECONDS_IN_MINUTE);
                server.on('connection', (socket) => {
                    socket.on('create room', () => {
                        room = new Room(socket, roomsManager, gameOptions);
                        const inviteAcceptedStub = stub(room, 'inviteAccepted' as any);
                        room.join(socket, 'player 2');
                        hostSocket.emit('accept');
                        setTimeout(() => {
                            expect(inviteAcceptedStub.calledOnce).to.deep.equal(true);
                            done();
                        }, RESPONSE_DELAY);
                    });
                });
                hostSocket.emit('create room');
            });

            it('client quit should call quitRoomClient', (done) => {
                let room: Room;
                const gameOptions = new GameOptions('player 1', 'b', GameMode.Classical, SECONDS_IN_MINUTE);
                roomsManager.removeRoom.callsFake(() => {
                    return;
                });
                server.on('connection', (socket) => {
                    socket.on('create room', () => {
                        room = new Room(socket, roomsManager, gameOptions);
                        const quitRoomClientStub = stub(room, 'quitRoomClient');
                        clientSocket.emit('join');
                        setTimeout(() => {
                            expect(quitRoomClientStub.calledOnce).to.deep.equal(true);
                            done();
                        }, RESPONSE_DELAY);
                    });
                    socket.on('join', () => {
                        room.join(socket, 'player 2');
                    });
                });
                hostSocket.on('player joining', () => {
                    clientSocket.emit('cancel join room');
                });
                hostSocket.emit('create room');
            });
        });
    });
});

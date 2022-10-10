/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { PORT, RESPONSE_DELAY } from '@app/environnement';
import { Server } from '@app/server';
import { expect } from 'chai';
import { EASY_BOT_NAMES, HARD_BOT_NAMES } from 'common/constants';
import { createServer, Server as httpServer } from 'http';
import { mock, restore, stub } from 'sinon';
import io from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { BotNameDatabaseService } from './bot-name-database.service';
import { BotNameService } from './bot-name.service';
import { BotDifficulty } from './bot.service';
import { SocketService } from './socket-manager.service';

describe('Bot Name service tests', () => {
    let service: BotNameService;

    beforeEach(async () => {
        service = new BotNameService();
        mock(Container.get(BotNameDatabaseService));
    });

    afterEach(() => {
        restore();
    });

    it('should return one of the initial easy bot name if no others where added', () => {
        expect(EASY_BOT_NAMES.includes(service.getBotName(BotDifficulty.Easy, 'Player1'))).to.equal(true);
    });

    it('should return one of the hard bot names when some where added', () => {
        const addedName = 'Player';
        service['addedHardNames'].push(addedName);
        const expectedPossibleNames = [...HARD_BOT_NAMES, addedName];
        expect(expectedPossibleNames.includes(service.getBotName(BotDifficulty.Hard, 'Player1'))).to.equal(true);
    });

    it('should add bot name to the addedEasyBotName when difficulty Easy', () => {
        const addedName = 'Player';
        service['addBotName'](BotDifficulty.Easy, addedName);
        expect(service['addedEasyNames'].includes(addedName)).to.equal(true);
    });

    it('should add bot name to the addedHardBotName when difficulty Hard', () => {
        const addedName = 'Player';
        service['addBotName'](BotDifficulty.Hard, addedName);
        expect(service['addedHardNames'].includes(addedName)).to.equal(true);
    });

    it('should not add any names when botNameExists returns true', () => {
        stub(service as any, 'botNameExists').callsFake(() => true);
        const addedName = 'Player';
        service['addBotName'](BotDifficulty.Hard, addedName);
        expect(service['addedHardNames'].includes(addedName)).to.not.equal(true);
    });

    it('should remove bot name to the addedEasyBotName when difficulty Easy', () => {
        const addedName = 'Player';
        service['addedEasyNames'].push(addedName);
        service['removeBotName'](BotDifficulty.Easy, addedName);
        expect(service['addedEasyNames'].includes(addedName)).to.equal(false);
    });

    it('should remove bot name to the addedHardBotName when difficulty Hard', () => {
        const addedName = 'Player';
        service['addedHardNames'].push(addedName);
        service['removeBotName'](BotDifficulty.Hard, addedName);
        expect(service['addedHardNames'].includes(addedName)).to.equal(false);
    });

    it('should not remove anything if name is not in array when difficulty Easy', () => {
        const addedName = 'Player';
        service['addedEasyNames'].push(addedName);
        const oldArrayNames = service['addedEasyNames'];
        service['removeBotName'](BotDifficulty.Easy, 'Player 1');
        expect(service['addedEasyNames']).to.equal(oldArrayNames);
    });

    it('should not remove anything if name is not in array when difficulty Hard', () => {
        const addedName = 'Player';
        service['addedHardNames'].push(addedName);
        const oldArrayNames = service['addedHardNames'];
        service['removeBotName'](BotDifficulty.Hard, 'Player 1');
        expect(service['addedHardNames']).to.equal(oldArrayNames);
    });

    it('resetAllNames should reset all modifiable lists to empty', () => {
        const addedName = 'Player';
        service['addedHardNames'].push(addedName);
        service['addedEasyNames'].push(addedName);
        service['resetAllNames']();
        expect(service['addedEasyNames'].length).to.equal(0);
        expect(service['addedHardNames'].length).to.equal(0);
    });

    it('botNameExists should return true if the bot Name is in the easyBotNames including default ones', () => {
        service['addedEasyNames'] = ['Name'];
        expect(service['botNameExists']('BOB')).to.equal(true);
        expect(service['botNameExists']('Name')).to.equal(true);
    });

    it('botNameExists should return true if the bot Name is in the hardBotNames including default ones', () => {
        service['addedHardNames'] = ['Name'];
        expect(service['botNameExists']('MIKE')).to.equal(true);
        expect(service['botNameExists']('Name')).to.equal(true);
    });

    it('modifyBotName should modify the name when in the addedEasyNames', () => {
        service['addedEasyNames'] = ['Name'];
        service['modifyBotName']('Name', 'Hello');
        expect(service['addedEasyNames'].includes('Hello')).to.equal(true);
        expect(service['addedEasyNames'].includes('Name')).to.equal(false);
    });

    it('modifyBotName should modify the name when in the addedHardNames', () => {
        service['addedHardNames'] = ['Name'];
        service['modifyBotName']('Name', 'Hello');
        expect(service['addedHardNames'].includes('Hello')).to.equal(true);
        expect(service['addedHardNames'].includes('Name')).to.equal(false);
    });

    it('setBotNames should set the addedBotNames', () => {
        service.setBotNames(['BOB'], ['Hello']);
        expect(service['addedHardNames'].includes('Hello')).to.equal(true);
        expect(service['addedEasyNames'].includes('BOB')).to.equal(true);
    });

    it('modifyBotName should not modify the name when in the initialNames', () => {
        service['modifyBotName']('BOB', 'Hello');
        expect(service['easyBotInitialName'].includes('Hello')).to.equal(false);
        expect(service['easyBotInitialName'].includes('BOB')).to.equal(true);
    });

    describe('socket connections', () => {
        let hostSocket: Socket;
        let server: io.Server;
        // eslint-disable-next-line @typescript-eslint/no-shadow
        let httpServer: httpServer;

        before((done) => {
            httpServer = createServer();
            httpServer.listen(PORT);
            server = new io.Server(httpServer);
            httpServer.on('listening', () => done());
        });

        beforeEach(() => {
            hostSocket = Client('http://localhost:3000');
            server.on('connection', (socket) => {
                service['setUpBotNameSocket'](socket);
            });
        });

        afterEach(() => {
            server.removeAllListeners();
            hostSocket.removeAllListeners();
        });

        after(() => {
            server.close();
            httpServer.close();
        });

        it('sendAllBotNames should emit receive bot name with all bot Names', (done) => {
            const expectedEasyNames = ['ROB', 'BOT', 'BOB'];
            const expectedHardNames = ['OLA', 'DYNO', 'MIKE', 'Name'];
            service['addedHardNames'] = ['Name'];
            Container.get(Server).socketService = {
                broadcastMessage: () => {
                    return;
                },
            } as unknown as SocketService;
            stub(Container.get(Server).socketService, 'broadcastMessage').callsFake((socketValue, names: { easy: string[]; hard: string[] }) => {
                expect(socketValue).to.equal('receive bot name');
                expectedEasyNames.forEach((name, index) => expect(names.easy[index]).to.equal(name));
                expectedHardNames.forEach((name, index) => expect(names.hard[index]).to.equal(name));
                done();
            });
            service['sendAllBotNames']();
        });

        it('setUpBotNameSocket on get bot names should call sendAllBotNames', (done) => {
            const sendAllBotNamesStub = stub(service as any, 'sendAllBotNames');
            hostSocket.emit('get bot names');
            setTimeout(() => {
                expect(sendAllBotNamesStub.calledOnce).to.equal(true);
                done();
            }, RESPONSE_DELAY);
        });

        it('setUpBotNameSocket on add bot name should call addBotName and sendAllBotNames', (done) => {
            const addBotNameStub = stub(service as any, 'addBotName');
            const sendAllBotNamesStub = stub(service as any, 'sendAllBotNames');
            hostSocket.emit('add bot name', { difficulty: BotDifficulty.Easy, name: 'Jackie' });
            setTimeout(() => {
                expect(addBotNameStub.calledOnce).to.equal(true);
                expect(sendAllBotNamesStub.calledOnce).to.equal(true);
                done();
            }, RESPONSE_DELAY);
        });

        it('setUpBotNameSocket on delete bot name should call removeBotName and sendAllBotNames', (done) => {
            const removeBotNameStub = stub(service as any, 'removeBotName');
            const sendAllBotNamesStub = stub(service as any, 'sendAllBotNames');

            hostSocket.emit('delete bot name', { difficulty: BotDifficulty.Easy, name: 'Jackie' });
            setTimeout(() => {
                expect(removeBotNameStub.calledOnce).to.equal(true);
                expect(sendAllBotNamesStub.calledOnce).to.equal(true);
                done();
            }, RESPONSE_DELAY);
        });

        it('setUpBotNameSocket on modify bot name should call modifyBotName and sendAllBotNames', (done) => {
            const modifyBotNameStub = stub(service as any, 'modifyBotName');
            const sendAllBotNamesStub = stub(service as any, 'sendAllBotNames');
            hostSocket.emit('modify bot name', { previousName: 'Jackie', modifiedName: 'Francis' });
            setTimeout(() => {
                expect(modifyBotNameStub.calledOnce).to.equal(true);
                expect(sendAllBotNamesStub.calledOnce).to.equal(true);
                done();
            }, RESPONSE_DELAY);
        });

        it('setUpBotNameSocket on reset all names should call resetAllNames and sendAllBotNames', (done) => {
            const resetAllNamesStub = stub(service as any, 'resetAllNames');
            const sendAllBotNamesStub = stub(service as any, 'sendAllBotNames');
            hostSocket.emit('reset all names');
            setTimeout(() => {
                expect(resetAllNamesStub.calledOnce).to.equal(true);
                expect(sendAllBotNamesStub.calledOnce).to.equal(true);
                done();
            }, RESPONSE_DELAY);
        });
    });
});

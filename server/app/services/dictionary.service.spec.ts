import { Application } from '@app/app';
import { Server } from '@app/server';
import { DictionaryService } from '@app/services/dictionary.service';
import { expect } from 'chai';
import { readdirSync, readFileSync } from 'fs';
import mockFs from 'mock-fs';
import { restore, stub } from 'sinon';
import { Server as SocketServer } from 'socket.io';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { Container } from 'typedi';

const portNo = 3000;

describe('Dictionary Service', () => {
    let service: DictionaryService;

    beforeEach(async () => {
        service = Container.get(DictionaryService);
    });

    it('init should hold the dictionaries in the dictionariesPath', async () => {
        mockFs({
            'assets/dictionaries/test.json': `{
	                "title": "test",
	                "description": "test",
	                "words": ["test"]
                }`,
        });
        await service.init();
        expect(service.dictionaries).to.be.of.length(1);
        expect(service.dictionaries[0].title).to.eq('test');
        mockFs.restore();
    });
    describe('filesystem interactions', () => {
        beforeEach(async () => {
            mockFs({
                'assets/dictionaries/test.json': `{
	                "title": "test",
	                "description": "test",
	                "words": ["test"]
                }`,
            });
            await service.init();
        });
        it('addDictionary should add to fs and to array on valid json input', () => {
            service.addDictionary(`{
                "title": "test2",
                "description": "test2",
                "words": ["test2"]
            }`);

            expect(service.dictionaries).to.be.of.length(2);
            expect(service.dictionaries[1].title).to.eq('test2');
            expect(service.dictionaries[1].description).to.eq('test2');
            expect(service.dictionaries[1].words[0]).to.eq('test2');
            expect(readdirSync('assets/dictionaries')).to.be.of.length(2);
        });

        it('addDictionary should return error on invalid json input', () => {
            const returnValue = service.addDictionary(`{
                "title": "test2",
                "description": "test2",
                "words": ["test2"
            }`);
            expect(returnValue).to.be.instanceOf(Error);
        });

        it('addDictionary should return error on a dictionary that already exists', () => {
            const returnValue = service.addDictionary(`{
                "title": "test",
                "description": "test",
                "words": ["test"]
            }`);
            expect(returnValue).to.be.instanceOf(Error);
        });

        it('deleteDictionary should delete files and the dictionary on valid input', () => {
            stub(Container.get(Server).socketService, 'broadcastMessage');
            service.deleteDictionary('test');
            expect(service.dictionaries).to.be.of.length(0);
            expect(readdirSync('assets/dictionaries')).to.be.of.length(0);
            restore();
        });

        it("deleteDictionary shouldn't delete on defaultDictionary name", () => {
            stub(Container.get(Server).socketService, 'broadcastMessage');
            expect(service.deleteDictionary('Francais')).to.be.a('Error');
            restore();
        });

        it("deleteDictionary shouldn't delete not found dictionary", () => {
            stub(Container.get(Server).socketService, 'broadcastMessage');
            expect(service.deleteDictionary('Francaisaaaa')).to.be.a('Error');
            restore();
        });

        it('modifyInfo should modify the info in fs and in array', () => {
            service.modifyInfo('test', 'test2', 'test2');
            expect(service.dictionaries[0].title).to.eq('test2');
            expect(service.dictionaries[0].description).to.eq('test2');
            expect(JSON.parse(readFileSync('assets/dictionaries/test2.json', 'utf8')).title).to.eq('test2');
            expect(JSON.parse(readFileSync('assets/dictionaries/test2.json', 'utf8')).description).to.eq('test2');
        });

        it("modifyInfo shouldn't modify anything if the dictionary already exists", () => {
            service.addDictionary(`{
                "title": "test2",
                "description": "test2",
                "words": ["test2"]
            }`);

            const returnValue = service.modifyInfo('test2', 'test', 'test');
            expect(returnValue).to.be.an('Error');
        });

        it("modifyInfo shouldn't modify anything if the old title dictionary does not exist", () => {
            const returnValue = service.modifyInfo('test2', 'test3', 'test3');
            expect(returnValue).to.be.an('Error');
        });
        it('reset should reset', () => {
            service.addDictionary(`{
                "title": "Francais",
                "description": "Francais",
                "words": ["Francais"]
            }`);
            service.reset();
            expect(service.dictionaries).to.be.of.length(1);
            expect(service.dictionaries[0].title).to.eq('Francais');
        });

        it('getDictionaryFile should return string of the dictionary', () => {
            expect(service.getDictionaryFile('test')).to.be.a('string');
        });

        it('broadcastDictionaryChange should callbroadcastMessage from socketService', () => {
            const broadcastStub = stub(Container.get(Server).socketService, 'broadcastMessage');
            // eslint-disable-next-line dot-notation
            service['broadcastDictionaryChange']();
            expect(broadcastStub.called).to.equal(true);
            restore();
        });

        afterEach(() => {
            mockFs.restore();
        });
    });

    describe('communication with sockets and http', () => {
        let server: SocketServer;
        let clientSocket: Socket;
        beforeEach(async () => {
            server = new SocketServer(portNo);
            mockFs({
                'test/testDic.json': '{"title": "testDic", "description": "testDic","words": ["testDic"] }',
                'assets/dictionaries/test.json': `{
	                "title": "test",
	                "description": "test",
	                "words": ["test"]
                }`,
            });

            await service.init();
            server.on('connection', (socket) => {
                service.setupSocketConnection(socket);
            });

            clientSocket = io('ws://localhost:3000');
        });
        it('setupSocketConnection emits receive dictionaries on get dictionaries', (done) => {
            clientSocket.on('receive dictionaries', () => {
                done();
            });

            clientSocket.emit('get dictionaries');
        });

        it('setupSocketConnection calls reset on reset dictionaries', (done) => {
            service.reset = () => {
                done();
            };
            clientSocket.emit('reset dictionaries');
        });

        it('setupSocketConnection emits delete dictionary failed on wrong delete dictionary', (done) => {
            clientSocket.on('delete dictionary failed', () => {
                done();
            });

            clientSocket.emit('delete dictionary');
        });

        it('setupSocketConnection emits delete dictionary success on right delete dictionary', (done) => {
            clientSocket.on('delete dictionary success', () => {
                done();
            });

            clientSocket.emit('delete dictionary', 'test');
        });

        it('setupSocketConnection emits modify dictionary failed on wrong right dictionary', (done) => {
            clientSocket.on('modify dictionary failed', () => {
                done();
            });

            clientSocket.emit('modify dictionary', { oldName: 'test2', newName: 'test2', newDescription: 'test2' });
        });

        it('setupSocketConnection emits modify dictionary success on right modify dictionary', (done) => {
            clientSocket.on('modify dictionary success', () => {
                done();
            });
            clientSocket.emit('modify dictionary', { oldName: 'test', newName: 'test2', newDescription: 'test2' });
        });

        it('get dictionaries from api should return the right dictionary', async () => {
            const res = await request(Container.get(Application).app).get('/admin/dictionary/test');
            expect(res.body.title).to.eq('test');
        });

        it('get dictionaries from api should send 404 when wrong name', async () => {
            const res = await request(Container.get(Application).app).get('/admin/dictionary/2test');
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(res.statusCode).to.eq(404);
        });

        it('send dictionaries from api should send the dictionary', async () => {
            const res = await request(Container.get(Application).app).post('/admin/dictionary').attach('dictionary', 'test/testDic.json');
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(res.statusCode).to.eq(200);
            expect(service.dictionaries).to.be.of.length(2);
        });
        it('send dictionaries from api should send the dictionary but return 400 if dictionary already exists', async () => {
            const res = await request(Container.get(Application).app).post('/admin/dictionary').attach('dictionary', 'assets/dictionaries/test.json');
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(res.statusCode).to.eq(400);
            expect(service.dictionaries).to.be.of.length(1);
        });
        it('send dictionaries from api should send the dictionary but return 400 if nothing is attached', async () => {
            const res = await request(Container.get(Application).app).post('/admin/dictionary');
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(res.statusCode).to.eq(400);
            expect(service.dictionaries).to.be.of.length(1);
        });

        afterEach(() => {
            server.close();
            mockFs.restore();
        });
    });
});

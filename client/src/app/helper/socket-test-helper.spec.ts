import { SocketTestHelper } from '@app/helper/socket-test-helper';

describe('SocketTestHelper', () => {
    let socketTestHelper: SocketTestHelper;

    beforeEach(() => {
        socketTestHelper = new SocketTestHelper();
    });

    it('should be created', () => {
        expect(socketTestHelper).toBeTruthy();
    });

    // La fonction disconnect est présente pour imiter la classe SocketClientService mais dans ce cas,
    // elle n'a pas besoin de faire quelque chose car il n'y a pas de réel connexion avec le server
    it('disconnect should not do anything', () => {
        const spy = spyOn(socketTestHelper, 'disconnect').and.callThrough();
        socketTestHelper.disconnect();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('on should call all functions given corresponding to the event', () => {
        const firstFunction = jasmine.createSpy();
        socketTestHelper.on('test counter', firstFunction);
        const secondFunction = jasmine.createSpy();
        socketTestHelper.on('test counter', secondFunction);
        socketTestHelper.peerSideEmit('test counter');
        expect(secondFunction).toHaveBeenCalledTimes(1);
        expect(firstFunction).toHaveBeenCalledTimes(1);
    });

    it('peerSideEmit should call the function corresponding to the event', () => {
        const spy = jasmine.createSpy();
        socketTestHelper.on('test counter', spy);
        socketTestHelper.peerSideEmit('test counter');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('peerSideEmit should not call a function if the event is not initialized', () => {
        const spy = jasmine.createSpy();
        socketTestHelper.on('test counter', spy);
        socketTestHelper.peerSideEmit('counter');
        expect(spy).toHaveBeenCalledTimes(0);
    });
});

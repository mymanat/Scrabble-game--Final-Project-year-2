import { expect } from 'chai';
import { GameOptions } from './game-options';
import { RoomInfo } from './room-info';

describe('RoomInfo', () => {
    it('should create an instance', () => {
        const timer = 60;
        const gameOptions = new GameOptions('Host 1', 'Mon Dictionaire', timer);
        const room = new RoomInfo('Room id', gameOptions);
        expect(room.gameOptions.hostname).to.eq('Host 1');
        expect(room.roomId).to.eq('Room id');
        expect(room.gameOptions).to.eq(gameOptions);
    });
});

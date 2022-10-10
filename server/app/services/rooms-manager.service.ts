import { GameError, GameErrorType } from '@app/classes/game.exception';
import { Room } from '@app/classes/room';
import { GameOptions } from 'common/classes/game-options';
import { RoomInfo } from 'common/classes/room-info';
import io from 'socket.io';
import { Service } from 'typedi';

@Service()
export class RoomsManager {
    private rooms: Room[];
    private joiningSockets: io.Socket[];

    constructor() {
        this.joiningSockets = [];
        this.rooms = [];
    }

    setupSocketConnection(socket: io.Socket) {
        socket.on('create solo room', (options) => {
            const room = this.createRoom(socket, options.gameOptions);
            room.initSoloGame(options.botLevel);
            socket.emit('create solo room success', room.getRoomInfo());
        });

        socket.on('create room', (options) => {
            socket.emit('create room success', this.createRoom(socket, options).getRoomInfo());
        });

        socket.on('request list', () => {
            this.joiningSockets.push(socket);
            this.sendAvailableRooms(socket);
        });

        socket.on('join room', (data) => {
            const error = this.joinRoom(data.roomId, socket, data.playerName);
            if (error) return;
            socket.emit('player joining', data.playerName);
            return;
        });
    }

    removeRoom(room: Room): void {
        this.rooms.splice(this.rooms.indexOf(room), 1);
        this.notifyAvailableRoomsChange();
    }

    getRooms(): RoomInfo[] {
        return this.rooms.map((r) => r.getRoomInfo());
    }

    sendAvailableRooms(socket: io.Socket) {
        socket.emit(
            'get list',
            this.rooms.filter((r) => r.game === null).map((r) => r.getRoomInfo()),
        );
    }

    switchPlayerSocket(oldSocket: io.Socket, newSocket: io.Socket): void {
        const room = this.getRoom(oldSocket.id);
        if (!room) return;
        if (room.host.id === oldSocket.id) {
            room.host = newSocket;
            if (room.clients[0]) room.removeUnneededListeners(room.clients[0]);
        } else {
            room.clients[0] = newSocket;
            room.removeUnneededListeners(room.host);
        }
        room.initiateRoomEvents();
    }

    getRoom(playerServerId: string): Room | undefined {
        return this.rooms.find((r) => r.getRoomInfo().roomId === playerServerId || r.clients[0]?.id === playerServerId);
    }

    notifyAvailableRoomsChange() {
        this.joiningSockets.forEach((socket) => this.sendAvailableRooms(socket));
    }

    removeSocketFromJoiningList(clientSocket: io.Socket) {
        this.joiningSockets.splice(this.joiningSockets.indexOf(clientSocket), 1);
    }

    private createRoom(socket: io.Socket, options: GameOptions): Room {
        const newRoom = new Room(socket, this, options);
        this.rooms.push(newRoom);
        this.notifyAvailableRoomsChange();
        return newRoom;
    }

    private joinRoom(roomId: string, socket: io.Socket, name: string): GameError | undefined {
        const room = this.getRoom(roomId);
        if (room) {
            room.join(socket, name);
        } else return new GameError(GameErrorType.GameNotExists);
        return;
    }
}

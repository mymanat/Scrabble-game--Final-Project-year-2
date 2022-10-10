import { Server } from '@app/server';
import { BotDifficulty } from '@app/services/bot.service';
import { EASY_BOT_NAMES, HARD_BOT_NAMES } from 'common/constants';
import io from 'socket.io';
import { Container, Service } from 'typedi';
import { BotNameDatabaseService } from './bot-name-database.service';

@Service()
export class BotNameService {
    private readonly easyBotInitialName = EASY_BOT_NAMES;
    private readonly hardBotInitialName = HARD_BOT_NAMES;
    private addedEasyNames: string[];
    private addedHardNames: string[];
    constructor() {
        this.addedEasyNames = [];
        this.addedHardNames = [];
    }

    setBotNames(easyNames: string[], hardNames: string[]): void {
        this.addedEasyNames = easyNames;
        this.addedHardNames = hardNames;
    }

    getBotName(difficulty: BotDifficulty, playerName: string): string {
        let possibleNames: string[];
        if (difficulty === BotDifficulty.Easy) {
            possibleNames = [...this.easyBotInitialName, ...this.addedEasyNames];
        } else {
            possibleNames = [...this.hardBotInitialName, ...this.addedHardNames];
        }
        let botName;
        while ((botName = possibleNames[Math.floor(Math.random() * possibleNames.length)]) === playerName);
        return botName;
    }

    setUpBotNameSocket(socket: io.Socket): void {
        socket.on('get bot names', () => {
            this.sendAllBotNames();
        });
        socket.on('add bot name', (nameParameters) => {
            this.addBotName(nameParameters.difficulty, nameParameters.name);
            this.sendAllBotNames();
        });
        socket.on('delete bot name', (nameParameters) => {
            this.removeBotName(nameParameters.difficulty, nameParameters.name);
            this.sendAllBotNames();
        });
        socket.on('modify bot name', (nameParameters) => {
            this.modifyBotName(nameParameters.previousName, nameParameters.modifiedName);
            this.sendAllBotNames();
        });
        socket.on('reset all names', () => {
            this.resetAllNames();
            this.sendAllBotNames();
        });
    }

    private addBotName(difficulty: BotDifficulty, name: string): void {
        if (this.botNameExists(name)) return;
        switch (difficulty) {
            case BotDifficulty.Easy:
                this.addedEasyNames.push(name);
                break;
            case BotDifficulty.Hard:
                this.addedHardNames.push(name);
                break;
        }
        Container.get(BotNameDatabaseService).addBotName(difficulty, name);
    }

    private removeBotName(difficulty: BotDifficulty, name: string): void {
        let index: number;
        switch (difficulty) {
            case BotDifficulty.Easy:
                index = this.addedEasyNames.indexOf(name);
                if (index < 0) return;
                this.addedEasyNames.splice(index, 1);
                break;
            case BotDifficulty.Hard:
                index = this.addedHardNames.indexOf(name);
                if (index < 0) return;
                this.addedHardNames.splice(index, 1);
                break;
        }
        Container.get(BotNameDatabaseService).removeBotName(difficulty, name);
    }

    private resetAllNames(): void {
        this.addedEasyNames = [];
        this.addedHardNames = [];
        Container.get(BotNameDatabaseService).resetDB();
    }

    private botNameExists(name: string): boolean {
        let exists = false;
        exists ||= [...this.easyBotInitialName, ...this.addedEasyNames].includes(name);
        exists ||= [...this.hardBotInitialName, ...this.addedHardNames].includes(name);
        return exists;
    }

    private modifyBotName(previousName: string, modifiedName: string): void {
        let nameIndex: number;
        if ((nameIndex = this.addedEasyNames.indexOf(previousName)) >= 0) {
            this.addedEasyNames[nameIndex] = modifiedName;
            Container.get(BotNameDatabaseService).changeName(BotDifficulty.Easy, previousName, modifiedName);
        } else if ((nameIndex = this.addedHardNames.indexOf(previousName)) >= 0) {
            this.addedHardNames[nameIndex] = modifiedName;
            Container.get(BotNameDatabaseService).changeName(BotDifficulty.Hard, previousName, modifiedName);
        }
    }

    private sendAllBotNames(): void {
        const easy = [...this.easyBotInitialName, ...this.addedEasyNames];
        const hard = [...this.hardBotInitialName, ...this.addedHardNames];
        const value = { easy, hard };
        Container.get(Server).socketService.broadcastMessage('receive bot name', value);
    }
}

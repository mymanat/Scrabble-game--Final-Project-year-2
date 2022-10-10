import { Server } from '@app/server';
import { Dictionary } from 'common/classes/dictionary';
import { DEFAULT_DICTIONARY } from 'common/constants';
import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { readdirSync, readFileSync, unlink, writeFileSync } from 'fs';
import path from 'path';
import io from 'socket.io';
import { Container, Service } from 'typedi';

const dictionariesPath = 'assets/dictionaries';

const resourceNotFound = 404;
const badRequest = 400;

@Service()
export class DictionaryService {
    dictionaries: Dictionary[] = [];
    router: Router;

    constructor() {
        this.configureRouter();
    }

    async init() {
        this.dictionaries = [];
        const paths = await readdirSync(dictionariesPath);
        await paths.forEach(async (fileName) => {
            const dictionaryPath = path.join(dictionariesPath, fileName);
            const json = await readFileSync(dictionaryPath, { encoding: 'utf8' });
            const obj = JSON.parse(json);
            this.dictionaries.push(new Dictionary(obj.title, obj.description, obj.words, dictionaryPath));
        });
    }

    deleteDictionary(dictionaryName: string): undefined | Error {
        if (dictionaryName === DEFAULT_DICTIONARY) return new Error('deleted dictionary is the default');
        const selectedDictionaryIndex = this.dictionaries.findIndex((d) => d.title === dictionaryName);
        if (selectedDictionaryIndex < 0) return new Error('dictionary not found');
        unlink(this.dictionaries[selectedDictionaryIndex].path, () => {
            return;
        });
        this.dictionaries.splice(selectedDictionaryIndex, 1);
        this.onDictionaryDeleted(dictionaryName);
        return;
    }

    addDictionary(content: string): undefined | Error {
        let obj: unknown;
        try {
            obj = JSON.parse(content);
        } catch (e) {
            return e;
        }

        const castedObj = obj as Dictionary;
        const dictionaryPath = path.join(dictionariesPath, castedObj.title.replace(/ /g, '_').concat('.json'));
        const dictionary = new Dictionary(castedObj.title, castedObj.description, castedObj.words, dictionaryPath);
        if (this.dictionaries.findIndex((d) => d.title === dictionary.title) >= 0) return Error('dictionary with the same title already exists');
        writeFileSync(dictionaryPath, content, 'utf8');
        this.dictionaries.push(dictionary);
        this.broadcastDictionaryChange();
        return;
    }

    modifyInfo(oldTitle: string, newTitle: string, newDescription: string): undefined | Error {
        if (this.getDictionary(newTitle) && oldTitle !== newTitle) return new Error('dictionary with the same title already exists');
        const dictionary = this.getDictionary(oldTitle);
        if (!dictionary) return new Error('dictionary not found');

        this.deleteDictionary(dictionary.title);

        dictionary.description = newDescription;
        dictionary.title = newTitle;

        const content = {
            title: dictionary.title,
            description: dictionary.description,
            words: dictionary.words,
        };

        this.addDictionary(JSON.stringify(content));
        return;
    }

    sendDictionaries(socket: io.Socket) {
        socket.emit(
            'receive dictionaries',
            this.dictionaries.map((d) => {
                return { title: d.title, description: d.description };
            }),
        );
    }

    reset(): void {
        [...this.dictionaries].forEach((d) => {
            if (d.title === DEFAULT_DICTIONARY) return;
            this.deleteDictionary(d.title);
        });
    }

    onDictionaryDeleted(dictionaryName: string): void {
        Container.get(Server).socketService.broadcastMessage('dictionary deleted', dictionaryName);
        this.broadcastDictionaryChange();
    }

    getDictionaryFile(name: string): string {
        return JSON.stringify(this.dictionaries.find((d) => d.title === name));
    }

    getDictionary(name: string): Dictionary | undefined {
        return this.dictionaries.find((d) => d.title === name);
    }

    configureRouter() {
        this.router = Router();
        this.router.get('/:id', (req, res) => {
            const dic = this.getDictionary(req.params.id);
            if (!dic) {
                res.status(resourceNotFound).send();
                return;
            }
            res.sendFile(dic.path, { root: path.join('./') });
        });
        this.router.post('/', (req, res) => {
            if (!req.files) {
                res.status(badRequest).send();
                return;
            }
            const response = this.addDictionary((req.files.dictionary as fileUpload.UploadedFile).data.toString('utf8'));
            if (response) {
                res.status(badRequest).send();
                return;
            }
            res.send('OK');
        });
    }

    setupSocketConnection(socket: io.Socket) {
        socket.on('reset dictionaries', () => {
            this.reset();
            this.sendDictionaries(socket);
        });
        socket.on('delete dictionary', (name) => {
            if (this.deleteDictionary(name)) {
                socket.emit('delete dictionary failed', name);
                return;
            }
            socket.emit('delete dictionary success', name);
        });
        socket.on('modify dictionary', ({ oldName, newName, newDescription }) => {
            if (this.modifyInfo(oldName, newName, newDescription)) {
                socket.emit('modify dictionary failed', oldName);
                return;
            }
            socket.emit('modify dictionary success', { oldName, newName, newDescription });
        });
        socket.on('get dictionaries', () => {
            this.sendDictionaries(socket);
        });
    }

    private broadcastDictionaryChange(): void {
        Container.get(Server).socketService.broadcastMessage(
            'receive dictionaries',
            this.dictionaries.map((d) => {
                return { title: d.title, description: d.description };
            }),
        );
    }
}

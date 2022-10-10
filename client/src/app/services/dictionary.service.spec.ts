/* eslint-disable dot-notation */
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { loadDictionariesSuccess } from '@app/actions/dictionaries.actions';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { iDictionary } from 'common/interfaces/dictionary';
import { cold } from 'jasmine-marbles';
import { Observable } from 'rxjs';
import { DictionaryService } from './dictionary.service';
import { SocketClientService } from './socket-client.service';

describe('DictionaryService', () => {
    const httpClientMock: { get: jasmine.Spy; post: jasmine.Spy } = {
        get: jasmine.createSpy('get'),
        post: jasmine.createSpy('post'),
    };
    let service: DictionaryService;
    let socketService: SocketTestHelper;
    let store: MockStore;

    beforeEach(() => {
        socketService = new SocketTestHelper();

        TestBed.configureTestingModule({
            providers: [
                provideMockStore(),
                {
                    provide: HttpClient,
                    useValue: httpClientMock,
                },
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketService,
                        send: (value: string) => {
                            socketService.emit(value);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketService.on(event, callback);
                            return;
                        },
                    },
                },
            ],
        });
        service = TestBed.inject(DictionaryService);
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getDictionaries should send "get dictionaries" to socket', () => {
        const spyOnGetDictionaries = spyOn(socketService, 'emit');
        service.getDictionaries();

        expect(spyOnGetDictionaries).toHaveBeenCalledWith('get dictionaries');
    });

    it('getDictionaries should wait for "receive dictionaries" from socket and dispatch "loadDictionariesSuccess"', () => {
        service.getDictionaries();

        const dictionaries: iDictionary[] = [{ title: 'dict', description: 'desc' }];
        const expectedAction = cold('a', { a: loadDictionariesSuccess({ dictionaries }) });

        socketService.peerSideEmit('receive dictionaries', dictionaries);
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('addDictionary should call http.post', () => {
        service.addDictionary({} as File);
        expect(httpClientMock.post).toHaveBeenCalled();
    });

    it('downloadDictionary should call http.get and ', async () => {
        const dictionary = { title: 'Title', description: 'dict description' } as iDictionary;
        spyOn(document, 'createElement').and.returnValue({
            setAttribute: () => {
                return;
            },
            click: () => {
                return;
            },
            remove: () => {
                return;
            },
        } as unknown as HTMLElement);
        spyOn(document.body, 'appendChild');
        httpClientMock.get.and.returnValue(
            new Observable<{ type: 'string' }>((observer) => {
                observer.next({ type: 'string' });
            }),
        );
        service.downloadDictionary(dictionary);
        expect(httpClientMock.get).toHaveBeenCalled();
    });

    it('resetDictionaries should call send with reset dictionaries and on with receive dictionaries', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const onSpy = spyOn(service['socketService'], 'on');
        service.resetDictionaries();
        expect(sendSpy).toHaveBeenCalledOnceWith('reset dictionaries');
        expect(onSpy).toHaveBeenCalled();
    });

    it('resetDictionaries should dispatch loadDictionariesSuccess with dictionary whe receiveDictionary received', () => {
        service.resetDictionaries();
        const dictionaries: iDictionary[] = [{ title: 'dict', description: 'desc' }];
        const expectedAction = cold('a', { a: loadDictionariesSuccess({ dictionaries }) });

        socketService.peerSideEmit('receive dictionaries', dictionaries);
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('deleteDictionary should call send with delete dictionary and title of the dictionary to delete', () => {
        const dictionary = { title: 'Title', description: 'dict description' } as iDictionary;
        const sendSpy = spyOn(service['socketService'], 'send');
        service.deleteDictionary(dictionary.title);
        expect(sendSpy).toHaveBeenCalledOnceWith('delete dictionary', dictionary.title);
    });

    it('modifyDictionary should call send with modify dictionary and dictionary description', () => {
        const dictionary = { title: 'Title', description: 'dict description' } as iDictionary;
        const oldTitle = 'Old';
        const sendSpy = spyOn(service['socketService'], 'send');
        service.modifyDictionary({ title: oldTitle } as iDictionary, dictionary);
        expect(sendSpy).toHaveBeenCalledOnceWith('modify dictionary', {
            oldName: oldTitle,
            newName: dictionary.title,
            newDescription: dictionary.description,
        });
    });
});

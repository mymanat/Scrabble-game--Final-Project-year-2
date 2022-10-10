import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { loadDictionariesSuccess } from '@app/actions/dictionaries.actions';
import { Store } from '@ngrx/store';
import { Dictionary } from 'common/classes/dictionary';
import { iDictionary } from 'common/interfaces/dictionary';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class DictionaryService {
    constructor(private socketService: SocketClientService, private store: Store, private http: HttpClient) {}

    getDictionaries(): void {
        this.socketService.send('get dictionaries');

        this.socketService.on('receive dictionaries', (dictionaries: iDictionary[]) => {
            this.store.dispatch(loadDictionariesSuccess({ dictionaries }));
        });
    }

    addDictionary(file: File): Observable<Dictionary> {
        const formData = new FormData();
        formData.append('dictionary', file);
        return this.http.post<Dictionary>(environment.serverUrl.concat('/admin/dictionary/'), formData);
    }

    resetDictionaries(): void {
        this.socketService.send('reset dictionaries');

        this.socketService.on('receive dictionaries', (dictionaries: iDictionary[]) => {
            this.store.dispatch(loadDictionariesSuccess({ dictionaries }));
        });
    }

    deleteDictionary(title: string) {
        this.socketService.send('delete dictionary', title);
    }

    modifyDictionary(oldDictionary: iDictionary, newDictionary: iDictionary): void {
        this.socketService.send('modify dictionary', {
            oldName: oldDictionary.title,
            newName: newDictionary.title,
            newDescription: newDictionary.description,
        });
    }

    downloadDictionary(dictionary: iDictionary): void {
        this.http
            .get(environment.serverUrl.concat('/admin/dictionary/', dictionary.title), { responseType: 'blob' as 'json' })
            // la reponse de la requete http n'a pas de type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .subscribe((response: any) => {
                const dataType = response.type;
                const binaryData = [];
                binaryData.push(response);
                const link = document.createElement('a');
                link.setAttribute('target', '_blank');
                link.setAttribute('href', window.URL.createObjectURL(new Blob(binaryData as BlobPart[], { type: dataType })));
                link.setAttribute('download', `${dictionary.title}.json`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
    }
}

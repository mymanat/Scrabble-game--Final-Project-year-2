// Fichier issu de l'exemple du cours de socketIo

/* eslint-disable */
// Le fichier qui nous est fournit contient plusieurs erreur esLint, comme on peut l'utiliser comme tel
// on a juste ignorer toutes les erreurs esLint relier a ce fichier
type CallbackSignature = (params: unknown) => unknown;

export class SocketTestHelper {
    id: string;
    private callbacks = new Map<string, CallbackSignature[]>();
    on(event: string, callback: CallbackSignature): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        this.callbacks.get(event)!.push(callback);
    }

    emit(event: string, ...params: any): void {
        return;
    }

    disconnect(): void {
        return;
    }

    peerSideEmit(event: string, params?: unknown): void {
        if (!this.callbacks.has(event)) {
            return;
        }

        for (const callback of this.callbacks.get(event)!) {
            callback(params);
        }
    }

    removeAllListeners() {
        return;
    }
}

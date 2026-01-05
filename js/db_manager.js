export const DB_NAME = 'WordDiceDB';
export const DB_VERSION = 1;
export const STORE_CHARACTERS = 'characters';

export class DBManager {
    static openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_CHARACTERS)) {
                    db.createObjectStore(STORE_CHARACTERS, { keyPath: 'name' });
                }
            };
        });
    }

    static async saveCharacter(characterData) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_CHARACTERS], 'readwrite');
            const store = transaction.objectStore(STORE_CHARACTERS);
            const request = store.put(characterData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async loadCharacter(name) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_CHARACTERS], 'readonly');
            const store = transaction.objectStore(STORE_CHARACTERS);
            const request = store.get(name);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async getAllCharacters() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_CHARACTERS], 'readonly');
            const store = transaction.objectStore(STORE_CHARACTERS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async deleteCharacter(name) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_CHARACTERS], 'readwrite');
            const store = transaction.objectStore(STORE_CHARACTERS);
            const request = store.delete(name);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

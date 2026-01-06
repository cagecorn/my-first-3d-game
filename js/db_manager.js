export const DB_NAME = 'WordDiceDB';
export const DB_VERSION = 2; // Incremented for Schema Update
export const STORE_CHARACTERS = 'characters';
export const STORE_MEMORY_BOX = 'memory_box'; // [NEW] Store for Ending Letters

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
                // [NEW] Create Memory Box Store
                if (!db.objectStoreNames.contains(STORE_MEMORY_BOX)) {
                    db.createObjectStore(STORE_MEMORY_BOX, { keyPath: 'id' });
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

    // --- Memory Box (Messiah System) Methods ---

    static async saveEndingLetter(letterData) {
        // letterData structure: { id: uuid, timestamp: number, content: string, syncRate: number }
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_MEMORY_BOX], 'readwrite');
            const store = transaction.objectStore(STORE_MEMORY_BOX);
            const request = store.put(letterData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async getAllEndingLetters() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_MEMORY_BOX], 'readonly');
            const store = transaction.objectStore(STORE_MEMORY_BOX);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // --- Emotional Snapshots ---

    static async saveSnapshot(snapshotData) {
        // snapshotData structure: { id: uuid, type: 'snapshot', timestamp: number, content: string, keywords: [] }
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_MEMORY_BOX], 'readwrite');
            const store = transaction.objectStore(STORE_MEMORY_BOX);
            const request = store.put(snapshotData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async getSnapshots() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_MEMORY_BOX], 'readonly');
            const store = transaction.objectStore(STORE_MEMORY_BOX);
            const request = store.getAll();

            request.onsuccess = (event) => {
                const results = event.target.result || [];
                // Filter for snapshots only
                const snapshots = results.filter(item => item.type === 'snapshot');
                resolve(snapshots);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// IndexedDB Database Wrapper

import { DB_NAME, DB_VERSION, STORE_SCHEMAS, STORES } from './schema';

class Database {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize and open the database
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });

    return this.dbPromise;
  }

  /**
   * Create object stores during database upgrade
   */
  private createStores(db: IDBDatabase): void {
    for (const [storeName, schema] of Object.entries(STORE_SCHEMAS)) {
      // Skip if store already exists
      if (db.objectStoreNames.contains(storeName)) {
        continue;
      }

      // Create object store
      const store = db.createObjectStore(storeName, {
        keyPath: schema.keyPath,
      });

      // Create indexes
      for (const index of schema.indexes) {
        store.createIndex(index.name, index.keyPath, { unique: index.unique });
      }

      console.log(`Created store: ${storeName}`);
    }
  }

  /**
   * Get a transaction for specified stores
   */
  private async getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBTransaction> {
    const db = await this.open();
    return db.transaction(storeNames, mode);
  }

  /**
   * Get an object store
   */
  private async getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Add a record to a store
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readwrite');
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put (add or update) a record in a store
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readwrite');
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a record by key
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readonly');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by index
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readonly');
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record by key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readwrite');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readonly');
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query records with cursor
   */
  async query<T>(
    storeName: string,
    options?: {
      index?: string;
      range?: IDBKeyRange;
      direction?: IDBCursorDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      const store = await this.getStore(storeName, 'readonly');
      const source = options?.index ? store.index(options.index) : store;
      const request = source.openCursor(options?.range, options?.direction);

      const results: T[] = [];
      let skipped = 0;
      const offset = options?.offset || 0;
      const limit = options?.limit || Infinity;

      request.onsuccess = () => {
        const cursor = request.result;
        
        if (!cursor || results.length >= limit) {
          resolve(results);
          return;
        }

        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }

        results.push(cursor.value as T);
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Batch put multiple records
   */
  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      for (const item of items) {
        store.put(item);
      }
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }

  /**
   * Delete the database
   */
  async deleteDatabase(): Promise<void> {
    this.close();
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        console.log('Database deleted');
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const db = new Database();

// Export store names for convenience
export { STORES };

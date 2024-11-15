// scripts/config/collections.js
import { DEFAULT_COLLECTIONS } from './defaultCollections.js';
import { Logger } from '../utils/logger.js';

export class CollectionManager {
    static #collections = null;

    static async loadCollections() {
        try {
            this.#collections = DEFAULT_COLLECTIONS.collections;
            Logger.log("Collections loaded", "INFO", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Failed to load collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static getCollections() {
        return this.#collections || [];
    }

    static getEnabledCollections() {
        return this.#collections?.filter(c => c.enabled) || [];
    }

    static toggleCollection(id, enabled) {
        const collection = this.#collections?.find(c => c.id === id);
        if (collection) {
            collection.enabled = enabled;
            Logger.log(`Collection ${id} ${enabled ? 'enabled' : 'disabled'}`, "INFO", "CONFIG");
            return true;
        }
        return false;
    }
}
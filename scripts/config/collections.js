// scripts/config/collections.js
import { world } from '@minecraft/server';
import { DEFAULT_COLLECTIONS } from './defaultCollections.js';
import { Logger } from '../utils/logger.js';

export class CollectionManager {
    static #STORAGE_KEY = 'sk_collections';
    static #collections = null;

    static async loadCollections() {
        try {
            const storedData = world.getDynamicProperty(this.#STORAGE_KEY);
            if (storedData) {
                this.#collections = JSON.parse(storedData);
            } else {
                this.#collections = DEFAULT_COLLECTIONS.collections;
                await this.saveCollections();
            }
            Logger.log("Collections loaded", "INFO", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Failed to load collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async saveCollections() {
        try {
            world.setDynamicProperty(this.#STORAGE_KEY, JSON.stringify(this.#collections));
            return true;
        } catch (error) {
            Logger.log(`Failed to save collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async addCollection(collection) {
        try {
            if (!collection.id || !collection.itemId || !collection.amount) {
                return false;
            }
            
            collection.enabled = true;
            this.#collections.push(collection);
            await this.saveCollections();
            return true;
        } catch (error) {
            Logger.log(`Failed to add collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static getCollections() {
        return this.#collections || [];
    }

    static getEnabledCollections() {
        return this.#collections?.filter(c => c.enabled) || [];
    }

    static async toggleCollection(id, enabled) {
        const collection = this.#collections?.find(c => c.id === id);
        if (collection) {
            collection.enabled = enabled;
            await this.saveCollections();
            return true;
        }
        return false;
    }
}
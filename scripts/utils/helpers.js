


// scripts/utils/collectionHelper.js
import { world } from '@minecraft/server';
import { Logger } from './logger.js';

export class CollectionHelper {
    static #ID_STORAGE_KEY = 'sk_collection_id_counter';

    static async generateId(baseName) {
        try {
            // Get current counter
            let counter = world.getDynamicProperty(this.#ID_STORAGE_KEY) || 0;
            
            // Increment counter
            counter++;
            
            // Save new counter
            world.setDynamicProperty(this.#ID_STORAGE_KEY, counter);
            
            // Format base name for ID
            const formattedBase = baseName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric chars with underscore
                .replace(/_+/g, '_')        // Replace multiple underscores with single
                .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
            
            // Generate ID with counter
            const newId = `${formattedBase}_${counter}`;
            
            Logger.log(`Generated new collection ID: ${newId}`, "DEBUG", "HELPER");
            
            return newId;
        } catch (error) {
            Logger.log(`Error generating collection ID: ${error}`, "ERROR", "HELPER");
            return `collection_${Date.now()}`;
        }
    }

    static async resetIdCounter() {
        try {
            world.setDynamicProperty(this.#ID_STORAGE_KEY, 0);
            Logger.log("Collection ID counter reset", "INFO", "HELPER");
            return true;
        } catch (error) {
            Logger.log(`Error resetting ID counter: ${error}`, "ERROR", "HELPER");
            return false;
        }
    }

    static async getCurrentCounter() {
        return world.getDynamicProperty(this.#ID_STORAGE_KEY) || 0;
    }

    
}
import { world } from '@minecraft/server';
import { Logger } from './logger.js';

// In helpers.js

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
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
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

    // New helper methods for collection validation
    static validateRequirements(requirements) {
        if (!Array.isArray(requirements) || requirements.length === 0) return false;
        return requirements.every(req => 
            req.itemId && 
            typeof req.itemId === 'string' && 
            req.amount && 
            Number.isInteger(req.amount) && 
            req.amount > 0
        );
    }

    static validateRewards(rewards) {
        if (!Array.isArray(rewards) || rewards.length === 0) return false;
        return rewards.every(reward => {
            if (!reward.type || !reward.displayText) return false;
            if (reward.type === 'item') {
                return reward.itemId && reward.amount && Number.isInteger(reward.amount) && reward.amount > 0;
            }
            if (reward.type === 'command') {
                return reward.command && typeof reward.command === 'string';
            }
            return false;
        });
    }

    static formatItemName(itemId) {
        return itemId.split(':')[1].replace(/_/g, ' ');
    }

    static generateDisplayText(item, amount) {
        return `${amount}x ${this.formatItemName(item)}`;
    }
}
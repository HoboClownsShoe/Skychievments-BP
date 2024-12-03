// scripts/config/collections.js
import { world } from '@minecraft/server';
import { DEFAULT_COLLECTIONS } from './defaultCollections.js';
import { Logger } from '../utils/logger.js';

// In collections.js

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
            Logger.log("Collections saved", "DEBUG", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Failed to save collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async addCollection(collection) {
        try {
            if (!this.validateCollection(collection)) {
                return false;
            }
            
            if (!this.#collections) {
                this.#collections = [];
            }
            
            collection.enabled = true;
            this.#collections.push(collection);
            await this.saveCollections();
            Logger.log(`Collection added successfully: ${collection.id}`, "INFO", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Failed to add collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static validateCollection(collection) {
        try {
            // Check required fields
            if (!collection.id || !collection.parentId || !collection.displayName) {
                Logger.log("Missing required collection fields", "ERROR", "CONFIG");
                return false;
            }

            // Validate requirements
            if (!collection.requirements || !Array.isArray(collection.requirements) || collection.requirements.length === 0) {
                Logger.log("Invalid or missing requirements", "ERROR", "CONFIG");
                return false;
            }

            for (const req of collection.requirements) {
                if (!req.itemId || !req.amount || req.amount < 1) {
                    Logger.log(`Invalid requirement: ${JSON.stringify(req)}`, "ERROR", "CONFIG");
                    return false;
                }
            }

            // Validate rewards
            if (!collection.rewards || !Array.isArray(collection.rewards) || collection.rewards.length === 0) {
                Logger.log("Invalid or missing rewards", "ERROR", "CONFIG");
                return false;
            }

            for (const reward of collection.rewards) {
                if (!reward.type || !reward.displayText) {
                    Logger.log(`Invalid reward: ${JSON.stringify(reward)}`, "ERROR", "CONFIG");
                    return false;
                }
                if (reward.type === 'item' && (!reward.itemId || !reward.amount)) {
                    Logger.log(`Invalid item reward: ${JSON.stringify(reward)}`, "ERROR", "CONFIG");
                    return false;
                }
                if (reward.type === 'command' && !reward.command) {
                    Logger.log(`Invalid command reward: ${JSON.stringify(reward)}`, "ERROR", "CONFIG");
                    return false;
                }
            }

            return true;
        } catch (error) {
            Logger.log(`Error validating collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static getCollections() {
        return this.#collections || [];
    }

    static getEnabledCollections() {
        return this.#collections?.filter(c => c.enabled) || [];
    }

    static getCollectionById(id) {
        return this.#collections?.find(c => c.id === id);
    }

    static async toggleCollection(id, enabled) {
        try {
            const collection = this.#collections?.find(c => c.id === id);
            if (collection) {
                collection.enabled = enabled;
                await this.saveCollections();
                Logger.log(`Collection ${id} ${enabled ? 'enabled' : 'disabled'}`, "INFO", "CONFIG");
                return true;
            }
            return false;
        } catch (error) {
            Logger.log(`Error toggling collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async removeCollection(id) {
        try {
            if (!this.#collections) return false;
            
            const index = this.#collections.findIndex(c => c.id === id);
            if (index === -1) return false;
            
            this.#collections.splice(index, 1);
            await this.saveCollections();
            Logger.log(`Collection ${id} removed`, "INFO", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Error removing collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async reloadDefaultCollections() {
        try {
            this.#collections = DEFAULT_COLLECTIONS.collections;
            await this.saveCollections();
            Logger.log("Collections reloaded from defaults", "INFO", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Error reloading default collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static getCollectionsByGroup(groupId) {
        return this.#collections?.filter(c => c.parentId === groupId) || [];
    }

    static getCollectionCount() {
        return this.#collections?.length || 0;
    }

    static getEnabledCollectionCount() {
        return this.getEnabledCollections().length;
    }

    static getGroupCollectionCount(groupId) {
        return this.getCollectionsByGroup(groupId).length;
    }
}
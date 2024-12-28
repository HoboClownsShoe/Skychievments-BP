// scripts/utils/collectionStorage.js
import { world } from '@minecraft/server';
import { Logger } from './logger';

export class CollectionStorage {
    static #COLLECTION_PREFIX = 'collection:';
    static #INDEX_KEY = 'collection:index';
    static #GROUP_PREFIX = 'group:';

    /**
     * Initialize the storage system
     */
    static initialize() {
        try {
            // Create the index if it doesn't exist
            if (!world.getDynamicProperty(this.#INDEX_KEY)) {
                world.setDynamicProperty(this.#INDEX_KEY, JSON.stringify([]));
            }
        } catch (error) {
            Logger.log(`Error initializing collection storage: ${error}`, "ERROR", "STORAGE");
            throw error;
        }
    }

    /**
     * Store a collection
     * @param {Object} collection The collection to store
     * @returns {boolean} Success status
     */
    static async saveCollection(collection) {
        try {
            // Validate collection
            if (!collection || !collection.id) {
                throw new Error('Invalid collection object');
            }

            // Add to index if not exists
            const index = this.#getIndex();
            if (!index.includes(collection.id)) {
                index.push(collection.id);
                world.setDynamicProperty(this.#INDEX_KEY, JSON.stringify(index));
            }

            // Store the collection
            const key = this.#COLLECTION_PREFIX + collection.id;
            world.setDynamicProperty(key, JSON.stringify(collection));

            // Update group index
            await this.#updateGroupIndex(collection.parentId, collection.id);

            return true;
        } catch (error) {
            Logger.log(`Error saving collection ${collection?.id}: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }

    /**
     * Retrieve a collection by ID
     * @param {string} id Collection ID
     * @returns {Object|null} The collection or null if not found
     */
    static getCollection(id) {
        try {
            const key = this.#COLLECTION_PREFIX + id;
            const data = world.getDynamicProperty(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            Logger.log(`Error getting collection ${id}: ${error}`, "ERROR", "STORAGE");
            return null;
        }
    }

    /**
     * Get all collections
     * @returns {Array} Array of collections
     */
    static getAllCollections() {
        try {
            const index = this.#getIndex();
            return index
                .map(id => this.getCollection(id))
                .filter(collection => collection !== null);
        } catch (error) {
            Logger.log(`Error getting all collections: ${error}`, "ERROR", "STORAGE");
            return [];
        }
    }

    /**
     * Get collections by group ID
     * @param {string} groupId The group ID
     * @returns {Array} Array of collections in the group
     */
    static getCollectionsByGroup(groupId) {
        try {
            const groupKey = this.#GROUP_PREFIX + groupId;
            const groupData = world.getDynamicProperty(groupKey);
            if (!groupData) return [];

            const groupIndex = JSON.parse(groupData);
            return groupIndex
                .map(id => this.getCollection(id))
                .filter(collection => collection !== null);
        } catch (error) {
            Logger.log(`Error getting collections for group ${groupId}: ${error}`, "ERROR", "STORAGE");
            return [];
        }
    }

    /**
     * Delete a collection
     * @param {string} id Collection ID
     * @returns {boolean} Success status
     */
    static async deleteCollection(id) {
        try {
            const collection = this.getCollection(id);
            if (!collection) return false;

            // Remove from index
            const index = this.#getIndex();
            const updatedIndex = index.filter(collectionId => collectionId !== id);
            world.setDynamicProperty(this.#INDEX_KEY, JSON.stringify(updatedIndex));

            // Remove from group index
            await this.#removeFromGroupIndex(collection.parentId, id);

            // Delete collection
            const key = this.#COLLECTION_PREFIX + id;
            world.clearDynamicProperty(key);

            return true;
        } catch (error) {
            Logger.log(`Error deleting collection ${id}: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }

    /**
     * Clear all collections
     * @returns {boolean} Success status
     */
    static clearAllCollections() {
        try {
            const index = this.#getIndex();
            
            // Clear all collection properties
            index.forEach(id => {
                const key = this.#COLLECTION_PREFIX + id;
                world.clearDynamicProperty(key);
            });

            // Clear group indices
            const groupKeys = this.#getAllGroupKeys();
            groupKeys.forEach(key => {
                world.clearDynamicProperty(key);
            });

            // Clear main index
            world.setDynamicProperty(this.#INDEX_KEY, JSON.stringify([]));

            return true;
        } catch (error) {
            Logger.log(`Error clearing all collections: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    static getStorageStats() {
        try {
            const index = this.#getIndex();
            const stats = {
                totalCollections: index.length,
                enabledCollections: 0,
                byGroup: {}
            };

            // Get group stats
            const collections = this.getAllCollections();
            collections.forEach(collection => {
                if (collection.enabled) stats.enabledCollections++;
                
                if (!stats.byGroup[collection.parentId]) {
                    stats.byGroup[collection.parentId] = {
                        total: 0,
                        enabled: 0
                    };
                }
                
                stats.byGroup[collection.parentId].total++;
                if (collection.enabled) {
                    stats.byGroup[collection.parentId].enabled++;
                }
            });

            return stats;
        } catch (error) {
            Logger.log(`Error getting storage stats: ${error}`, "ERROR", "STORAGE");
            return null;
        }
    }

    // Private helper methods
    static #getIndex() {
        try {
            const data = world.getDynamicProperty(this.#INDEX_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            Logger.log(`Error getting index: ${error}`, "ERROR", "STORAGE");
            return [];
        }
    }

    static async #updateGroupIndex(groupId, collectionId) {
        try {
            const groupKey = this.#GROUP_PREFIX + groupId;
            const groupData = world.getDynamicProperty(groupKey);
            const groupIndex = groupData ? JSON.parse(groupData) : [];

            if (!groupIndex.includes(collectionId)) {
                groupIndex.push(collectionId);
                world.setDynamicProperty(groupKey, JSON.stringify(groupIndex));
            }
        } catch (error) {
            Logger.log(`Error updating group index: ${error}`, "ERROR", "STORAGE");
        }
    }

    static async #removeFromGroupIndex(groupId, collectionId) {
        try {
            const groupKey = this.#GROUP_PREFIX + groupId;
            const groupData = world.getDynamicProperty(groupKey);
            if (!groupData) return;

            const groupIndex = JSON.parse(groupData);
            const updatedIndex = groupIndex.filter(id => id !== collectionId);
            world.setDynamicProperty(groupKey, JSON.stringify(updatedIndex));
        } catch (error) {
            Logger.log(`Error removing from group index: ${error}`, "ERROR", "STORAGE");
        }
    }

    static #getAllGroupKeys() {
        try {
            const index = this.#getIndex();
            const groupIds = new Set();
            
            // Get all unique group IDs from collections
            index.forEach(id => {
                const collection = this.getCollection(id);
                if (collection) {
                    groupIds.add(collection.parentId);
                }
            });

            // Convert to group keys
            return Array.from(groupIds).map(id => this.#GROUP_PREFIX + id);
        } catch (error) {
            Logger.log(`Error getting group keys: ${error}`, "ERROR", "STORAGE");
            return [];
        }
    }
}
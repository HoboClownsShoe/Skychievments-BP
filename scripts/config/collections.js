// scripts/config/collections.js
import { world } from '@minecraft/server';
import { DEFAULT_COLLECTIONS } from './defaultCollections.js';
import { Logger } from '../utils/logger.js';
import { COLLECTION_GROUPS, CollectionGroupManager } from './collectionGroups.js';

export class CollectionManager {
    static #STORAGE_PREFIX = 'sk_collections_group_';
    static #INITIAL_LOAD_KEY = 'sk_initial_load_complete';
    static #collectionsCache = null;

    static async loadCollections(groupId = null) {
        try {
            // Check if this is the initial load
            const isInitialLoad = !world.getDynamicProperty(this.#INITIAL_LOAD_KEY);

            if (isInitialLoad) {
                // On initial load, use hardcoded defaults
                Logger.log("Performing initial load from hardcoded defaults", "INFO", "CONFIG");
                const success = await this.#loadFromDefaults(true);
                if (success) {
                    world.setDynamicProperty(this.#INITIAL_LOAD_KEY, 'true');
                }
                return success;
            }

            // For subsequent loads, load from dynamic properties
            return await this.#loadFromStorage(groupId);

        } catch (error) {
            Logger.log(`Failed to load collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

/**
     * Loads collections from hardcoded defaults
     * @param {boolean} setAsStorage If true, saves the defaults to dynamic properties
     */
    static async #loadFromDefaults(setAsStorage = false) {
        try {
            let success = true;
            this.#collectionsCache = [];

            // Load each group's collections from defaults
            for (const groupId of CollectionGroupManager.getGroupIds()) {
                const defaultCollections = DEFAULT_COLLECTIONS[groupId] || [];
                
                if (setAsStorage) {
                    // Save to dynamic properties if this is initial load
                    const storageKey = `${this.#STORAGE_PREFIX}${groupId}`;
                    world.setDynamicProperty(storageKey, JSON.stringify(defaultCollections));
                }

                this.#collectionsCache.push(...defaultCollections);
                Logger.log(`Loaded ${defaultCollections.length} default collections for group ${groupId}`, "INFO", "CONFIG");
            }

            return success;
        } catch (error) {
            Logger.log(`Error loading from defaults: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    /**
     * Loads collections from dynamic properties
     */
    static async #loadFromStorage(groupId = null) {
        try {
            // If no specific group, load all groups
            if (!groupId) {
                let success = true;
                this.#collectionsCache = [];

                for (const gId of CollectionGroupManager.getGroupIds()) {
                    const groupSuccess = await this.#loadFromStorage(gId);
                    if (!groupSuccess) success = false;
                }

                return success;
            }

            // Load specific group
            const storageKey = `${this.#STORAGE_PREFIX}${groupId}`;
            const storedData = world.getDynamicProperty(storageKey);
            
            if (!storedData) {
                Logger.log(`No stored collections found for group ${groupId}`, "WARN", "CONFIG");
                return false;
            }

            const groupCollections = JSON.parse(storedData);

            // Update cache for this group
            if (!this.#collectionsCache) {
                this.#collectionsCache = [];
            }
            
            // Remove existing collections for this group
            this.#collectionsCache = this.#collectionsCache.filter(c => c.parentId !== groupId);
            
            // Add loaded collections
            this.#collectionsCache.push(...groupCollections);

            Logger.log(`Loaded ${groupCollections.length} collections for group ${groupId}`, "INFO", "CONFIG");
            return true;

        } catch (error) {
            Logger.log(`Error loading from storage: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    /**
     * Admin function to add new hardcoded collections without affecting existing ones
     */
    static async loadNewDefaultCollections() {
        try {
            let addedCollections = 0;

            for (const groupId of CollectionGroupManager.getGroupIds()) {
                const storageKey = `${this.#STORAGE_PREFIX}${groupId}`;
                const storedData = world.getDynamicProperty(storageKey);
                const currentCollections = storedData ? JSON.parse(storedData) : [];
                const defaultCollections = DEFAULT_COLLECTIONS[groupId] || [];

                // Find new collections that don't exist in storage
                const existingIds = new Set(currentCollections.map(c => c.id));
                const newCollections = defaultCollections.filter(c => !existingIds.has(c.id));

                if (newCollections.length > 0) {
                    // Add new collections to existing ones
                    currentCollections.push(...newCollections);
                    world.setDynamicProperty(storageKey, JSON.stringify(currentCollections));
                    addedCollections += newCollections.length;
                    
                    Logger.log(`Added ${newCollections.length} new collections to group ${groupId}`, "INFO", "CONFIG");
                }
            }

            // Reload from storage to update cache
            await this.#loadFromStorage();

            return addedCollections;

        } catch (error) {
            Logger.log(`Error loading new defaults: ${error}`, "ERROR", "CONFIG");
            return 0;
        }
    }

/**
     * Development function to completely reset the system
     */
    static async resetToDefaults() {
        try {
            // Clear initial load flag
            world.setDynamicProperty(this.#INITIAL_LOAD_KEY, undefined);

            // Clear all group storage
            for (const groupId of CollectionGroupManager.getGroupIds()) {
                const storageKey = `${this.#STORAGE_PREFIX}${groupId}`;
                world.setDynamicProperty(storageKey, undefined);
            }

            // Clear cache
            this.#collectionsCache = null;

            // Reload everything as if it's initial load
            return await this.loadCollections();

        } catch (error) {
            Logger.log(`Error resetting to defaults: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async saveCollections(collections = this.#collectionsCache) {
        try {
            // Group collections by parentId
            const groupedCollections = {};
            for (const collection of collections) {
                if (!groupedCollections[collection.parentId]) {
                    groupedCollections[collection.parentId] = [];
                }
                groupedCollections[collection.parentId].push(collection);
            }

            // Save each group separately
            for (const group of COLLECTION_GROUPS) {
                const groupKey = `${this.#STORAGE_PREFIX}${group.id}`;
                const groupCollections = groupedCollections[group.id] || [];
                world.setDynamicProperty(groupKey, JSON.stringify(groupCollections));
                Logger.log(`Saved collections for group ${group.id}`, "DEBUG", "CONFIG");
            }

            this.#collectionsCache = collections;
            return true;
        } catch (error) {
            Logger.log(`Failed to save collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async addCollection(collection) {
        try {
            // Validate the collection first
            if (!collection.id || !collection.parentId || !collection.displayName) {
                Logger.log("Missing required collection fields", "ERROR", "CONFIG");
                return false;
            }
    
            // Validate group ID
            if (!CollectionGroupManager.getGroupById(collection.parentId)) {
                Logger.log(`Invalid group ID: ${collection.parentId}`, "ERROR", "CONFIG");
                return false;
            }
    
            // Get the storage key for this group
            const storageKey = `${this.#STORAGE_PREFIX}${collection.parentId}`;
    
            // Get current collections for this group
            let groupCollections = [];
            const storedData = world.getDynamicProperty(storageKey);
            if (storedData) {
                groupCollections = JSON.parse(storedData);
            }
    
            // Check if collection ID already exists
            if (groupCollections.some(c => c.id === collection.id)) {
                Logger.log(`Collection ID ${collection.id} already exists`, "ERROR", "CONFIG");
                return false;
            }
    
            // Add the new collection
            groupCollections.push(collection);
    
            // Save updated collections
            world.setDynamicProperty(storageKey, JSON.stringify(groupCollections));
    
            // Update cache if it exists
            if (this.#collectionsCache) {
                this.#collectionsCache.push(collection);
            }
    
            Logger.log(`Collection added successfully: ${collection.id}`, "INFO", "CONFIG");
            return true;
    
        } catch (error) {
            Logger.log(`Failed to add collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static getCollections() {
        return this.#collectionsCache || [];
    }

    static getEnabledCollections() {
        return this.#collectionsCache?.filter(c => c.enabled) || [];
    }

    static getCollectionsByGroup(groupId) {
        return this.#collectionsCache?.filter(c => c.parentId === groupId) || [];
    }

    static async toggleCollection(id, enabled) {
        try {
            const collection = this.#collectionsCache?.find(c => c.id === id);
            if (!collection) return false;

            // Update collection enabled status
            collection.enabled = enabled;

            // Save the entire group containing this collection
            const groupCollections = this.getCollectionsByGroup(collection.parentId);
            const groupKey = `${this.#STORAGE_PREFIX}${collection.parentId}`;
            world.setDynamicProperty(groupKey, JSON.stringify(groupCollections));

            Logger.log(`Collection ${id} ${enabled ? 'enabled' : 'disabled'}`, "DEBUG", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Error toggling collection: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    static async reloadDefaultCollections() {
        try {
            // Clear all group collections
            for (const group of COLLECTION_GROUPS) {
                const groupKey = `${this.#STORAGE_PREFIX}${group.id}`;
                world.setDynamicProperty(groupKey, undefined);
            }

            // Reset cache
            this.#collectionsCache = null;

            // Reload from defaults
            return await this.loadCollections();
        } catch (error) {
            Logger.log(`Error reloading default collections: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

     /**
     * Calculates the approximate storage size of a collection in bytes.
     * This helps track how much space each collection uses in the dynamic property.
     */
     static #calculateCollectionSize(collection) {
        try {
            // Convert to JSON and measure the string length in bytes
            const jsonString = JSON.stringify(collection);
            // UTF-16 uses 2 bytes per character
            return jsonString.length * 2;
        } catch (error) {
            Logger.log(`Error calculating collection size: ${error}`, "ERROR", "CONFIG");
            return 0;
        }
    }

    /**
     * Gets storage statistics for all groups or a specific group.
     * Returns information about used space, available space, and collection counts.
     */
    static async getStorageStats(groupId = null) {
        try {
            const stats = {};
            // Maximum size for a dynamic property in bytes (32KB)
            const MAX_PROPERTY_SIZE = 32 * 1024;

            const processGroup = async (group) => {
                const groupKey = `${this.#STORAGE_PREFIX}${group.id}`;
                const rawData = world.getDynamicProperty(groupKey);
                const collections = rawData ? JSON.parse(rawData) : [];
                
                // Calculate total size used
                const usedSize = rawData ? rawData.length * 2 : 0;
                const collectionSizes = collections.map(c => ({
                    id: c.id,
                    size: this.#calculateCollectionSize(c)
                }));

                return {
                    totalCollections: collections.length,
                    enabledCollections: collections.filter(c => c.enabled).length,
                    usedSpace: usedSize,
                    availableSpace: MAX_PROPERTY_SIZE - usedSize,
                    spaceUsedPercent: ((usedSize / MAX_PROPERTY_SIZE) * 100).toFixed(1),
                    maxCollectionsAllowed: CollectionGroupManager.getGroupCollectionLimit(group.id),
                    remainingCollections: CollectionGroupManager.getGroupCollectionLimit(group.id) - collections.length,
                    largestCollections: collectionSizes
                        .sort((a, b) => b.size - a.size)
                        .slice(0, 5),
                    averageCollectionSize: collections.length > 0 
                        ? (usedSize / collections.length).toFixed(1)
                        : 0
                };
            };

            if (groupId) {
                // Get stats for specific group
                const group = CollectionGroupManager.getGroupById(groupId);
                if (!group) {
                    throw new Error(`Invalid group ID: ${groupId}`);
                }
                stats[groupId] = await processGroup(group);
            } else {
                // Get stats for all groups
                for (const group of COLLECTION_GROUPS) {
                    stats[group.id] = await processGroup(group);
                }

                // Add total statistics
                stats.total = {
                    totalCollections: Object.values(stats)
                        .reduce((sum, group) => sum + group.totalCollections, 0),
                    enabledCollections: Object.values(stats)
                        .reduce((sum, group) => sum + group.enabledCollections, 0),
                    totalUsedSpace: Object.values(stats)
                        .reduce((sum, group) => sum + group.usedSpace, 0),
                    totalAvailableSpace: Object.values(stats)
                        .reduce((sum, group) => sum + group.availableSpace, 0)
                };
            }

            return stats;
        } catch (error) {
            Logger.log(`Error getting storage stats: ${error}`, "ERROR", "CONFIG");
            return null;
        }
    }

    /**
     * Formats storage statistics into a readable string for display
     */
    static formatStorageStats(stats) {
        if (!stats) return "§cError getting storage statistics";

        let output = "§2§lCollection Storage Statistics\n\n";

        // Format individual group stats
        for (const [groupId, groupStats] of Object.entries(stats)) {
            if (groupId === 'total') continue;

            const group = CollectionGroupManager.getGroupById(groupId);
            output += `§6${group.displayName}§r\n`;
            output += `§7Collections: ${groupStats.enabledCollections}/${groupStats.totalCollections} enabled§r\n`;
            output += `§7Space Used: ${(groupStats.usedSpace / 1024).toFixed(1)}KB/${(32).toFixed(1)}KB (${groupStats.spaceUsedPercent}%)§r\n`;
            output += `§7Remaining Collections: ${groupStats.remainingCollections}§r\n`;
            
            if (groupStats.largestCollections.length > 0) {
                output += "§7Largest Collections:§r\n";
                groupStats.largestCollections.forEach(c => {
                    output += `  §8- ${c.id}: ${(c.size / 1024).toFixed(1)}KB§r\n`;
                });
            }
            
            output += `§7Average Collection Size: ${(groupStats.averageCollectionSize / 1024).toFixed(1)}KB§r\n\n`;
        }

        // Add total statistics if available
        if (stats.total) {
            output += "§2§lTotals§r\n";
            output += `§7Total Collections: ${stats.total.totalCollections} (${stats.total.enabledCollections} enabled)§r\n`;
            output += `§7Total Space Used: ${(stats.total.totalUsedSpace / 1024).toFixed(1)}KB§r\n`;
            output += `§7Total Space Available: ${(stats.total.totalAvailableSpace / 1024).toFixed(1)}KB§r\n`;
        }

        return output;
    }
}
// scripts/config/collections.js
import { world } from '@minecraft/server';
import { Logger } from '../utils/logger.js';
import { RequirementChecker } from '../managers/requirementsManager.js'; // Import RequirementChecker
import { COLLECTION_GROUPS} from '../config/collectionGroups.js';
import { DEFAULT_COLLECTIONS } from '../config/collections.js';
import { JsonDatabase } from '../database/con-database.js';


export class CollectionManager {
    static async initialize() {
        try {
            // Initialize storage
            CollectionStorage.initialize();

            // Load default collections if needed
            for (const [groupId, defaultCollections] of Object.entries(DEFAULT_COLLECTIONS)) {
                for (const collection of defaultCollections) {
                    const existingCollection = CollectionStorage.getCollection(collection.id);
                    if (!existingCollection) {
                        await CollectionStorage.saveCollection(collection);
                    }
                }
            }

            Logger.log("Collection storage initialized with defaults", "DEBUG", "COLLECTION_MANAGER");
            return true;
        } catch (error) {
            Logger.log(`Failed to initialize collection storage: ${error}`, "ERROR", "COLLECTION_MANAGER");
            return false;
        }
    }

    // Basic CRUD operations
    static getCollections() {
        return CollectionStorage.getAllCollections();
    }

    static getCollectionById(id) {
        return CollectionStorage.getCollection(id);
    }

    static getCollectionsByGroup(groupId) {
        return CollectionStorage.getCollectionsByGroup(groupId);
    }

    static getEnabledCollections() {
        return this.getCollections().filter(c => c.enabled);
    }

    static async addCollection(collection) {
        return await CollectionStorage.saveCollection(collection);
    }

    static async updateCollection(collection) {
        return await CollectionStorage.saveCollection(collection);
    }

    static async deleteCollection(id) {
        return await CollectionStorage.deleteCollection(id);
    }

    static async toggleCollection(id, enabled) {
        const collection = this.getCollectionById(id);
        if (!collection) return false;

        collection.enabled = enabled;
        return await this.updateCollection(collection);
    }

    static getStorageStats() {
        return CollectionStorage.getStorageStats();
    }

    static formatStorageStats(stats) {
        if (!stats) return "§cNo storage statistics available";
        
        return (
            `§7Total Collections: §f${stats.totalCollections}\n` +
            `§7Enabled: §f${stats.enabledCollections}\n\n` +
            `§7By Group:\n` +
            Object.entries(stats.byGroup)
                .map(([groupId, groupStats]) => 
                    `§7${groupId}: §f${groupStats.enabled}/${groupStats.total} enabled`
                )
                .join('\n')
        );
    }

    // Helper methods for default collections
    static getDefaultCollectionsForGroup(groupId) {
        return DEFAULT_COLLECTIONS[groupId] || [];
    }

    static validateDefaultCollections() {
        let isValid = true;
        const errors = [];
    
        for (const [groupId, collections] of Object.entries(DEFAULT_COLLECTIONS)) {
            collections.forEach(collection => {
                if (!collection.id || !collection.parentId || !collection.displayName) {
                    errors.push(`Invalid collection in group ${groupId}: Missing required fields`);
                    isValid = false;
                }
    
                if (collection.parentId !== groupId) {
                    errors.push(`Collection ${collection.id} has mismatched parentId (${collection.parentId}) for group ${groupId}`);
                    isValid = false;
                }
    
                if (!Array.isArray(collection.requirements) || collection.requirements.length === 0) {
                    errors.push(`Collection ${collection.id} has invalid requirements`);
                    isValid = false;
                }
    
                if (!Array.isArray(collection.rewards) || collection.rewards.length === 0) {
                    errors.push(`Collection ${collection.id} has invalid rewards`);
                    isValid = false;
                }
            });
        }
    
        return { isValid, errors };
    }

    static getTotalDefaultCollections() {
        return Object.values(DEFAULT_COLLECTIONS)
            .reduce((total, collections) => total + collections.length, 0);
    }
}

export class CollectionHandler {

    static #db;

    /**
     * Initialize the group manager
     */
    static initialize() {
        try {
            this.#db = new JsonDatabase("skychievments_progress");                
            Logger.log("Collection Handler initialized", "DEBUG", "LOGGER");
            return true;           
        } catch (error) {
            console.warn(`Failed to initialize Collecion handler: ${error}`);
            return false;
        }
    }

    static async isCollectionCompleted(player, collectionId) {
        try {
            const progress = await this.getPlayerProgress(player);
            let status = progress[collectionId]?.completed || false;

            Logger.log(`Checking Quest status of ${collectionId} for player ${player.name}. Quest is ${status}`, "DEBUG", "COLLECTIONS");

            return status;
        } catch (error) {
            Logger.log(`Error checking collection completion: ${error}`, "ERROR", "COLLECTIONS");
            return false;
        }
    }

    static async checkGroupProgress(player, groupId) {
        try {
            console.warn(`Checking group progress for ${player.name} in group ${groupId}`);
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                Logger.log(`Invalid group ID ${groupId} for progress check`, "ERROR", "COLLECTIONS");
                return { claimableCollections: [], progress: {} };
            }

            // Get all collections for this group using new storage
            const collections = CollectionStorage.getCollectionsByGroup(groupId)
                .filter(c => c.enabled);

            if (collections.length === 0) {
                Logger.log(`No collections found for group ${groupId}`, "DEBUG", "COLLECTIONS");
                return { claimableCollections: [], progress: {} };
            }

            // Get player progress
            let progress = await this.getPlayerProgress(player);
            if (!progress) {
                progress = {};
            }

            // No need for manual inventory scan here anymore

            const claimableCollections = [];

            // Check requirements using RequirementChecker
            for (const collection of collections) {
                try {
                    // Skip if already completed
                    if (progress[collection.id]?.completed) continue;

                    // Check requirements using the unified checker
                    const checkResult = RequirementChecker.checkRequirements(player, collection.requirements);
                    const { requirements: checkedReqs, allCompleted: allRequirementsMet } = checkResult;

                    // Initialize or update progress based on checker results
                    let progressUpdated = false;
                    if (!progress[collection.id]) {
                        // Initialize progress if it doesn't exist
                        progress[collection.id] = {
                            requirements: checkedReqs.map(req => ({
                                type: req.type, // Store type for potential future use
                                itemId: collection.requirements.find(r => r.type === req.type)?.itemId, // Find original itemId if needed
                                amount: req.currentValue,
                                completed: req.isCompleted
                            })),
                            completed: false
                        };
                        progressUpdated = true; // Progress was initialized
                    } else {
                        // Update existing progress if values changed
                        for (let i = 0; i < checkedReqs.length; i++) {
                            const currentProgReq = progress[collection.id].requirements[i];
                            const checkedReq = checkedReqs[i];
                            if (currentProgReq.amount !== checkedReq.currentValue || currentProgReq.completed !== checkedReq.isCompleted) {
                                currentProgReq.amount = checkedReq.currentValue;
                                currentProgReq.completed = checkedReq.isCompleted;
                                progressUpdated = true;
                            }
                        }
                    }

                    // If all requirements are met, add to claimable collections
                    if (allRequirementsMet) {
                        claimableCollections.push({
                            collection,
                            // Pass the latest checked requirements state
                            requirements: progress[collection.id].requirements
                        });
                    }

                    // Save updated progress only if something changed
                    if (progressUpdated) {
                        await this.savePlayerProgress(player, progress);
                    }
                } catch (collectionError) {
                    Logger.log(`Error processing collection ${collection.id}: ${collectionError}`, "ERROR", "COLLECTIONS");
                    continue;
                }
            }

            return {
                claimableCollections,
                progress,
                groupStats: await this.#getGroupProgressStats(groupId, progress)
            };

        } catch (error) {
            Logger.log(`Error checking group progress: ${error}`, "ERROR", "COLLECTIONS");
            return { claimableCollections: [], progress: {} };
        }
    }

    static async claimCollection(player, claimableCollection) {
        try {
            const { collection, requirements } = claimableCollection;

            // Grant rewards
            const grantedRewards = [];
            const failedRewards = [];

            for (const reward of collection.rewards) {
                try {
                    if (reward.type === 'command') {
                        await player.runCommandAsync(reward.command);
                        grantedRewards.push(reward.displayText);
                    } else if (reward.type === 'item') {
                        await player.runCommandAsync(`give @p ${reward.itemId} ${reward.amount}`);
                        grantedRewards.push(reward.displayText);
                    }
                    Logger.log(`Granted reward: ${reward.displayText}`, "DEBUG", "COLLECTIONS");
                } catch (rewardError) {
                    Logger.log(`Failed to grant reward: ${rewardError}`, "ERROR", "COLLECTIONS");
                    failedRewards.push(reward.displayText);
                }
            }

            // Update progress to mark collection as completed
            const progress = await this.getPlayerProgress(player);
            progress[collection.id] = {
                requirements,
                completed: true,
                completedAt: Date.now()
            };
            
            await this.savePlayerProgress(player, progress);

            // Format reward message
            let message = `§q§lCollection Complete! §r§q${collection.displayName}\n`;
            if (grantedRewards.length > 0) {
                message += `§7Rewards granted:\n§7- ${grantedRewards.join('\n§7- ')}\n`;
            }
            if (failedRewards.length > 0) {
                message += `\n§cFailed to grant:\n§c- ${failedRewards.join('\n§c- ')}`;
            }

            return {
                success: failedRewards.length === 0,
                message
            };

        } catch (error) {
            Logger.log(`Error claiming collection: ${error}`, "ERROR", "COLLECTIONS");
            return {
                success: false,
                message: '§cError claiming collection reward.'
            };
        }
    }

    static async getPlayerProgress(player) {
        try {
            const progress = this.#db.get(player.id);
            Logger.log(`Got Quest progress for player ${player.name}`, "DEBUG", "COLLECTIONS");
            return progress || {};
        } catch (error) {
            Logger.log(`Error getting player progress: ${error}`, "ERROR", "COLLECTIONS");
            return {};
        }
    }

    static async savePlayerProgress(player, progress) {
        try {
            this.#db.set(player.id, progress);
            Logger.log(`Saved progress for player ${player.name}`, "DEBUG", "COLLECTIONS");
            return true;
        } catch (error) {
            Logger.log(`Error saving player progress: ${error}`, "ERROR", "COLLECTIONS");
            return false;
        }
    }

    static async getCollectionProgress(player, collectionId) {
        try {
            const progress = await this.getPlayerProgress(player);
            return progress[collectionId] || { 
                requirements: [], 
                completed: false 
            };
        } catch (error) {
            Logger.log(`Error getting collection progress: ${error}`, "ERROR", "COLLECTIONS");
            return { requirements: [], completed: false };
        }
    }

    static async getCompletedCollections(player) {
        try {
            const progress = await this.getPlayerProgress(player);
            return Object.entries(progress)
                .filter(([_, data]) => data.completed)
                .map(([id, data]) => ({
                    id,
                    completedAt: data.completedAt
                }));
        } catch (error) {
            Logger.log(`Error getting completed collections: ${error}`, "ERROR", "COLLECTIONS");
            return [];
        }
    }

        // New helper method to calculate group progress statistics
        static async #getGroupProgressStats(groupId, progress) {
            const group = CollectionGroupManager.getGroupById(groupId);
            const groupCollections = CollectionManager.getCollectionsByGroup(groupId);
            
            const completedCount = groupCollections.filter(c => progress[c.id]?.completed).length;
            const totalCount = groupCollections.length;
            const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
            return {
                groupName: group.displayName,
                totalCollections: totalCount,
                completedCollections: completedCount,
                completionPercentage: completionPercentage.toFixed(1),
                remainingCollections: totalCount - completedCount
            };
        }
}

export class CollectionStorage {
    static #db;

    static initialize() {
            try {
                this.#db = new JsonDatabase("skychievments_collections");                
                Logger.log("Collection Storage initialized", "DEBUG", "LOGGER");
                return true;           
            } catch (error) {
                console.warn(`Failed to initialize Collection Storage: ${error}`);
                return false;
            }
        }

    static async saveCollection(collection) {
        try {
            if (!collection?.id) {
                throw new Error('Invalid collection object');
            }
            this.#db.set(collection.id, collection);
            return true;
        } catch (error) {
            Logger.log(`Error saving collection ${collection?.id}: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }

    static getCollection(id) {
        try {
            return this.#db.has(id) ? this.#db.get(id) : null;
        } catch (error) {
            Logger.log(`Error getting collection ${id}: ${error}`, "ERROR", "STORAGE");
            return null;
        }
    }

    static getAllCollections() {
        try {
            return [...this.#db.values()];
        } catch (error) {
            Logger.log(`Error getting all collections: ${error}`, "ERROR", "STORAGE");
            return [];
        }
    }

    static getCollectionsByGroup(groupId) {
        try {
            const groupCollections = [];
            this.#db.forEach((collection) => {
                if (collection.parentId === groupId) {
                    groupCollections.push(collection);
                }
            });
            return groupCollections;
        } catch (error) {
            Logger.log(`Error getting collections for group ${groupId}: ${error}`, "ERROR", "STORAGE");
            return [];
        }
    }

    static deleteCollection(id) {
        try {
            return this.#db.delete(id);
        } catch (error) {
            Logger.log(`Error deleting collection ${id}: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }

    static clearAllCollections() {
        try {
            this.#db.clear();
            return true;
        } catch (error) {
            Logger.log(`Error clearing all collections: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }

    static getStorageStats() {
        try {
            const stats = {
                totalCollections: this.#db.size,
                enabledCollections: 0,
                byGroup: {}
            };

            this.#db.forEach((collection) => {
                if (collection.enabled) {
                    stats.enabledCollections++;
                }
                
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

    static isValid() {
        return this.#db?.isValid() && !this.#db?.isDisposed;
    }
}

// Default display settings for groups
const DEFAULT_GROUP_SETTINGS = {
    iconSize: 32,
    defaultOrder: 999,
    maxCollectionsPerGroup: 150,  // Practical limit based on dynamic property size
    enabled : true
};

export class CollectionGroupManager {
    static #db;
    static #DB_NAME = "skychievments_groups";

    /**
     * Initialize the group manager
     */
    static initialize() {
        try {
            this.#db = new JsonDatabase("skychievments_groups");                
            Logger.log("Collection Groups initialized", "DEBUG", "LOGGER");
            return true;           
        } catch (error) {
            console.warn(`Failed to initialize Collection Groups: ${error}`);
            return false;
        }
    }

    /**
     * Gets current state of groups
     */
    static async getGroupStates() {
        try {
            return this.#db.get('states') || {};
        } catch (error) {
            Logger.log(`Error getting group states: ${error}`, "ERROR", "CONFIG");
            return {};
        }
    }

    /**
     * Sets state of group
     */
    static async setGroupState(groupId, enabled) {
        try {
            if (!this.isValidGroupId(groupId)) {
                throw new Error(`Invalid group ID: ${groupId}`);
            }

            const states = await this.getGroupStates();
            states[groupId] = enabled;
            this.#db.set('states', states);
            
            Logger.log(`Group ${groupId} ${enabled ? 'enabled' : 'disabled'}`, "DEBUG", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Error setting group state: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    /**
     * Is the group enabled
     */
    static async isGroupEnabled(groupId) {
        try {
            const states = await this.getGroupStates();
            // If no state is stored, use the default from group definition
            return states[groupId] ?? COLLECTION_GROUPS.find(g => g.id === groupId)?.enabled ?? true;
        } catch (error) {
            Logger.log(`Error checking group state: ${error}`, "ERROR", "CONFIG");
            return true; // Default to enabled on error
        }
    }

    /**
     * Get all enabled groups
     */
    static async getEnabledGroups() {
        const groups = [];
        for (const group of COLLECTION_GROUPS) {
            if (await this.isGroupEnabled(group.id)) {
                groups.push(group);
            }
        }
        return groups.sort((a, b) => a.order - b.order);
    }

    /**
     * Get a collection group by its ID
     */
    static getGroupById(groupId) {
        return COLLECTION_GROUPS.find(group => group.id === groupId);
    }

    /**
     * Get all group IDs in order
     */
    static getGroupIds() {
        return COLLECTION_GROUPS
            .sort((a, b) => a.order - b.order)
            .map(group => group.id);
    }

    /**
     * Get group settings
     */
    static getGroupSettings(groupId) {
        const group = this.getGroupById(groupId);
        return {
            ...DEFAULT_GROUP_SETTINGS,
            ...(group?.settings || {})
        };
    }

    /**
     * Validate a group ID
     */
    static isValidGroupId(groupId) {
        return COLLECTION_GROUPS.some(group => group.id === groupId);
    }

    /**
     * Gets groups that have active collections for a player
     */
    static async getActiveGroupsForPlayer(player) {
        try {
            const allCollections = CollectionStorage.getAllCollections();
            const enabledCollections = allCollections.filter(c => c.enabled);
            const playerProgress = await CollectionHandler.getPlayerProgress(player);
            const groupStates = await this.getGroupStates();
            const activeGroups = [];
            
            for (const group of COLLECTION_GROUPS) {
                const isEnabled = groupStates[group.id] ?? group.enabled ?? true;
                if (!isEnabled) {
                    Logger.log(`Group ${group.id} is disabled, skipping`, "DEBUG", "CONFIG");
                    continue;
                }

                const groupCollections = enabledCollections.filter(c => c.parentId === group.id);
                if (groupCollections.length === 0) {
                    Logger.log(`Group ${group.id} has no enabled collections, skipping`, "DEBUG", "CONFIG");
                    continue;
                }

                const hasIncompleteCollections = groupCollections.some(collection => {
                    const collectionProgress = playerProgress[collection.id];
                    return !collectionProgress?.completed;
                });

                if (hasIncompleteCollections) {
                    activeGroups.push(group);
                    Logger.log(`Group ${group.id} added to active groups`, "DEBUG", "CONFIG");
                }
            }

            return activeGroups.sort((a, b) => a.order - b.order);
        } catch (error) {
            Logger.log(`Error getting active groups for player: ${error}`, "ERROR", "CONFIG");
            return [];
        }
    }

    /**
     * Reset all collection groups to their default states
     */
    static async resetToDefaults() {
        try {
            Logger.log("Starting collection groups reset to defaults", "DEBUG", "CONFIG");

            // Clear group states
            this.#db.clear();
            Logger.log("Cleared existing group states", "DEBUG", "CONFIG");

            // Reset data in storage
            for (const group of COLLECTION_GROUPS) {
                const groupCollections = CollectionStorage.getCollectionsByGroup(group.id);
                for (const collection of groupCollections) {
                    await CollectionStorage.deleteCollection(collection.id);
                }
                Logger.log(`Reset storage for group: ${group.id}`, "DEBUG", "CONFIG");
            }

            // Initialize default states
            const defaultStates = {};
            for (const group of COLLECTION_GROUPS) {
                defaultStates[group.id] = group.enabled;
            }

            // Save default states
            this.#db.set('states', defaultStates);
            Logger.log("Initialized default group states", "DEBUG", "CONFIG");

            return true;
        } catch (error) {
            Logger.log(`Failed to reset collection groups: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    /**
     * Dispose of the database when done
     */
    static dispose() {
        if (this.#db && !this.#db.isDisposed) {
            this.#db.dispose();
        }
    }

    /**
     * Check if the database is valid
     */
    static isValid() {
        return this.#db?.isValid() && !this.#db?.isDisposed;
    }
}

// Export for use in other files
export const MAX_COLLECTIONS_TOTAL = COLLECTION_GROUPS.reduce(
    (total, group) => total + (group.settings?.maxCollectionsPerGroup || 
                              DEFAULT_GROUP_SETTINGS.maxCollectionsPerGroup), 
    0
);

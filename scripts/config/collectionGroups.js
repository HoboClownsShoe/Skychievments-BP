// scripts/config/collectionGroups.js
import { Logger } from '../utils/logger.js';
import { world } from '@minecraft/server';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { CollectionStorage } from '../utils/collectionStorage.js';

// Default display settings for groups
const DEFAULT_GROUP_SETTINGS = {
    iconSize: 32,
    defaultOrder: 999,
    maxCollectionsPerGroup: 150,  // Practical limit based on dynamic property size
    enabled : true
};

// Define the collection groups with their properties
export const COLLECTION_GROUPS = [
    {
        id: "group_tools",
        name: "Tools",
        displayName: "Tool Time",
        description: "§7Right tool for the Job",
        icon: "textures/ui/groupIcons/tool_icon.png",
        order: 100,
        enabled: true,
        settings: {
            // Custom settings can override defaults
            maxCollectionsPerGroup: 100
        }
    },
    {
        id: "group_mining",
        name: "Mining",
        displayName: "Mining",
        description: "§7Mine your way to success!",
        icon: "textures/ui/groupIcons/mining_icon.png",
        order: 200,
        enabled: true,
        settings: {
            maxCollectionsPerGroup: 100  // Mining might need more slots
        }
    },
    {
        id: "group_farming",
        name: "Farming",
        displayName: "Farming",
        description: "§7Grow your farming empire!",
        icon: "textures/ui/groupIcons/farming_icon.png",
        order: 300,
        enabled: true
    },
    {
        id: "group_combat",
        name: "Combat",
        displayName: "Combat",
        description: "§7Prove your combat prowess!",
        icon: "textures/ui/groupIcons/combat_icon.png",
        order: 400,
        enabled: true
    },
    {
        id: "group_technology",
        name: "Technology",
        displayName: "Tech",
        description: "§7Time to Automate",
        icon: "textures/ui/groupIcons/tech_icon.png",
        order: 500,
        enabled: true
    },
    {
        id: "group_fishing",
        name: "Fishing",
        displayName: "Time to Fish",
        description: "§7Cast a line....",
        icon: "textures/ui/groupIcons/fishing_icon.png",
        order: 600,
        enabled: true
    },
    {
        id: "group_spare",
        name: "spare",
        displayName: "Spare",
        description: "§7Spare",
        icon: "textures/ui/groupIcons/fishing_icon.png",
        order: 700,
        enabled: true
    }
];

// Helper class for managing collection groups
export class CollectionGroupManager {
    static #GROUP_STORAGE_KEY = 'sk_group_states';

    /**
     * Gets currecnt state of groups
     * @returns groupstates
     */
    static async getGroupStates() {
        try {
            const stored = world.getDynamicProperty(this.#GROUP_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            Logger.log(`Error getting group states: ${error}`, "ERROR", "CONFIG");
            return {};
        }
    }

    /**
     * Sets state of group
     * @param {*} groupId 
     * @param {*} enabled 
     * @returns bool if state set
     */
    static async setGroupState(groupId, enabled) {
        try {
            if (!this.isValidGroupId(groupId)) {
                throw new Error(`Invalid group ID: ${groupId}`);
            }

            const states = await this.getGroupStates();
            states[groupId] = enabled;
            world.setDynamicProperty(this.#GROUP_STORAGE_KEY, JSON.stringify(states));
            
            Logger.log(`Group ${groupId} ${enabled ? 'enabled' : 'disabled'}`, "DEBUG", "CONFIG");
            return true;
        } catch (error) {
            Logger.log(`Error setting group state: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    /**
     * Is teh group enabled
     * @param {*} groupId 
     * @returns true if group is enabled
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
     * Get all enabeld groups
     * @returns all enabeld groups
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
     * @param {string} groupId - The ID of the group to find
     * @returns {object|null} The group object or null if not found
     */
    static getGroupById(groupId) {
        return COLLECTION_GROUPS.find(group => group.id === groupId);
    }

    /**
     * Get all group IDs in order
     * @returns {string[]} Array of group IDs
     */
    static getGroupIds() {
        return COLLECTION_GROUPS
            .sort((a, b) => a.order - b.order)
            .map(group => group.id);
    }

    /**
     * Get the storage key for a specific group
     * @param {string} groupId - The ID of the group
     * @returns {string} The storage key for the group
     */
    static getGroupStorageKey(groupId) {
        return `sk_collections_group_${groupId}`;
    }

    /**
     * Get the maximum allowed collections for a group
     * @param {string} groupId - The ID of the group
     * @returns {number} Maximum number of collections allowed
     */
    static getGroupCollectionLimit(groupId) {
        const group = this.getGroupById(groupId);
        return group?.settings?.maxCollectionsPerGroup || 
               DEFAULT_GROUP_SETTINGS.maxCollectionsPerGroup;
    }

    /**
     * Check if a group has space for more collections
     * @param {string} groupId - The ID of the group
     * @param {number} currentCount - Current number of collections in the group
     * @returns {boolean} Whether the group can accept more collections
     */
    static canAddToGroup(groupId, currentCount) {
        const limit = this.getGroupCollectionLimit(groupId);
        return currentCount < limit;
    }

    /**
     * Get groups by category type
     * @param {string} category - Category to filter by (e.g., "resource", "combat")
     * @returns {object[]} Array of matching groups
     */
    static getGroupsByCategory(category) {
        return COLLECTION_GROUPS.filter(group => 
            group.id.toLowerCase().includes(category.toLowerCase()));
    }

    /**
     * Get display settings for a group
     * @param {string} groupId - The ID of the group
     * @returns {object} Combined default and custom settings
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
     * @param {string} groupId - The ID to validate
     * @returns {boolean} Whether the group ID is valid
     */
    static isValidGroupId(groupId) {
        return COLLECTION_GROUPS.some(group => group.id === groupId);
    }

      /**
     * Gets groups that have active collections for a player.
     * A group is considered active if:
     * 1. The group itself is enabled
     * 2. It has at least one enabled collection
     * 3. The player has at least one incomplete collection in the group
     * 
     * @param {import("@minecraft/server").Player} player - The player to check
     * @returns {Promise<Array>} Array of groups with active collections
     */
      static async getActiveGroupsForPlayer(player) {
        try {
            // Get enabled collections using new storage system
            const allCollections = CollectionStorage.getAllCollections();
            const enabledCollections = allCollections.filter(c => c.enabled);
            const playerProgress = await CollectionHandler.getPlayerProgress(player);
    
            // Get group states
            const groupStates = await this.getGroupStates();
    
            // Filter groups to only those that are enabled and have active collections
            const activeGroups = [];
            
            for (const group of COLLECTION_GROUPS) {
                // Skip if group is explicitly disabled
                const isEnabled = groupStates[group.id] ?? group.enabled ?? true;
                if (!isEnabled) {
                    Logger.log(`Group ${group.id} is disabled, skipping`, "DEBUG", "CONFIG");
                    continue;
                }
    
                // Get enabled collections for this group using new storage
                const groupCollections = enabledCollections.filter(c => c.parentId === group.id);
                
                if (groupCollections.length === 0) {
                    Logger.log(`Group ${group.id} has no enabled collections, skipping`, "DEBUG", "CONFIG");
                    continue;
                }
    
                // Check for incomplete collections
                const hasIncompleteCollections = groupCollections.some(collection => {
                    const collectionProgress = playerProgress[collection.id];
                    return !collectionProgress?.completed;
                });
    
                if (hasIncompleteCollections) {
                    activeGroups.push(group);
                    Logger.log(`Group ${group.id} added to active groups`, "DEBUG", "CONFIG");
                } else {
                    Logger.log(`Group ${group.id} skipped - all collections completed`, "DEBUG", "CONFIG");
                }
            }
    
            return activeGroups.sort((a, b) => a.order - b.order);
    
        } catch (error) {
            Logger.log(`Error getting active groups for player: ${error}`, "ERROR", "CONFIG");
            return [];
        }
    }

    static async canAddToGroup(groupId, currentCount = null) {
        try {
            const limit = this.getGroupCollectionLimit(groupId);
            if (currentCount === null) {
                // Get current count from storage
                const groupCollections = await CollectionStorage.getCollectionsByGroup(groupId);
                currentCount = groupCollections.length;
            }
            return currentCount < limit;
        } catch (error) {
            Logger.log(`Error checking group capacity: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }

    /**
     * Resets all collection groups to their default states
     * This is primarily for development/testing purposes
     * @returns {Promise<boolean>} Success status of the reset operation
     */
    static async resetToDefaults() {
        try {
            Logger.log("Starting collection groups reset to defaults", "DEBUG", "CONFIG");

            // Clear all existing group states
            world.setDynamicProperty(this.#GROUP_STORAGE_KEY, undefined);
            Logger.log("Cleared existing group states", "DEBUG", "CONFIG");

            // Reset group-specific storage using new storage system
            for (const group of COLLECTION_GROUPS) {
                const groupCollections = await CollectionStorage.getCollectionsByGroup(group.id);
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
            world.setDynamicProperty(this.#GROUP_STORAGE_KEY, JSON.stringify(defaultStates));
            Logger.log("Initialized default group states", "DEBUG", "CONFIG");

            // Verify reset
            const verifyStates = await this.getGroupStates();
            let verified = true;
            for (const group of COLLECTION_GROUPS) {
                if (verifyStates[group.id] !== group.enabled) {
                    verified = false;
                    Logger.log(`Verification failed for group: ${group.id}`, "ERROR", "CONFIG");
                    break;
                }
            }

            if (!verified) throw new Error("Group state verification failed");
            
            Logger.log("Successfully reset all collection groups to defaults", "DEBUG", "CONFIG");
            return true;

        } catch (error) {
            Logger.log(`Failed to reset collection groups: ${error}`, "ERROR", "CONFIG");
            return false;
        }
    }
}

// Export for use in other files
export const MAX_COLLECTIONS_TOTAL = COLLECTION_GROUPS.reduce(
    (total, group) => total + (group.settings?.maxCollectionsPerGroup || 
                              DEFAULT_GROUP_SETTINGS.maxCollectionsPerGroup), 
    0
);
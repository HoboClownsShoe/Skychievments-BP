// scripts/utils/helpers.js
import { world } from '@minecraft/server';
import { Logger } from './logger.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';
import { CollectionManager } from '../config/collections.js';

export class CollectionHelper {
    // We store ID counters per group to keep collection IDs organized
    static #ID_STORAGE_PREFIX = 'sk_collection_id_counter_';

    static async generateId(baseName, groupId) {
        try {
            if (!groupId) {
                throw new Error(`Group ID is required for ID generation`);
            }
    
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                throw new Error(`Invalid group ID: ${groupId}`);
            }
    
            // Get current counter for this group
            const counterKey = `${this.#ID_STORAGE_PREFIX}${groupId}`;
            let counter = world.getDynamicProperty(counterKey) || 0;
            
            // Increment counter
            counter++;
            
            // Save new counter
            world.setDynamicProperty(counterKey, counter);
            
            // Format base name for ID
            const formattedBase = baseName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
            // Generate ID including group prefix
            const newId = `${groupId}_${formattedBase}_${counter}`;
            
            Logger.log(`Generated new collection ID: ${newId}`, "DEBUG", "HELPER");
            
            return newId;
        } catch (error) {
            Logger.log(`Error generating collection ID: ${error}`, "ERROR", "HELPER");
            return null;  // Return null instead of a fallback ID to ensure proper error handling
        }
    }

    /**
     * Reset ID counters for all groups or a specific group
     */
    static async resetIdCounter(groupId = null) {
        try {
            if (groupId) {
                // Reset specific group counter
                if (!CollectionGroupManager.isValidGroupId(groupId)) {
                    throw new Error(`Invalid group ID: ${groupId}`);
                }
                const counterKey = `${this.#ID_STORAGE_PREFIX}${groupId}`;
                world.setDynamicProperty(counterKey, 0);
                Logger.log(`Reset collection ID counter for group ${groupId}`, "DEBUG", "HELPER", groupId);
            } else {
                // Reset all group counters
                for (const gId of CollectionGroupManager.getGroupIds()) {
                    const counterKey = `${this.#ID_STORAGE_PREFIX}${gId}`;
                    world.setDynamicProperty(counterKey, 0);
                }
                Logger.log("Reset all collection ID counters", "DEBUG", "HELPER");
            }
            return true;
        } catch (error) {
            Logger.log(`Error resetting ID counter: ${error}`, "ERROR", "HELPER", groupId);
            return false;
        }
    }

    /**
     * Get current ID counter for a group
     */
    static async getCurrentCounter(groupId) {
        if (!CollectionGroupManager.isValidGroupId(groupId)) {
            return 0;
        }
        const counterKey = `${this.#ID_STORAGE_PREFIX}${groupId}`;
        return world.getDynamicProperty(counterKey) || 0;
    }

    /**
     * Validates a collection's structure and requirements
     */
    static validateCollection(collection, groupId) {
        try {
            // Validate group
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                return { valid: false, errors: ["Invalid group ID"] };
            }

            const errors = [];

            // Check required fields
            if (!collection.id || !collection.parentId || !collection.displayName) {
                errors.push("Missing required fields (id, parentId, or displayName)");
            }

            // Validate group membership
            if (collection.parentId !== groupId) {
                errors.push(`Collection parentId (${collection.parentId}) does not match group (${groupId})`);
            }

            // Validate requirements
            if (!collection.requirements || !Array.isArray(collection.requirements) || collection.requirements.length === 0) {
                errors.push("Invalid or missing requirements");
            } else {
                collection.requirements.forEach((req, index) => {
                    if (!req.itemId || !req.amount || req.amount < 1) {
                        errors.push(`Invalid requirement at index ${index}`);
                    }
                });
            }

            // Validate rewards
            if (!collection.rewards || !Array.isArray(collection.rewards) || collection.rewards.length === 0) {
                errors.push("Invalid or missing rewards");
            } else {
                collection.rewards.forEach((reward, index) => {
                    if (!reward.type || !reward.displayText) {
                        errors.push(`Invalid reward at index ${index}`);
                    }
                    if (reward.type === 'item' && (!reward.itemId || !reward.amount)) {
                        errors.push(`Invalid item reward at index ${index}`);
                    }
                    if (reward.type === 'command' && !reward.command) {
                        errors.push(`Invalid command reward at index ${index}`);
                    }
                });
            }

            // Check storage limits
            if (!CollectionGroupManager.canAddToGroup(groupId, 1)) {
                errors.push("Group storage limit would be exceeded");
            }

            return {
                valid: errors.length === 0,
                errors
            };
        } catch (error) {
            Logger.log(`Error validating collection: ${error}`, "ERROR", "HELPER", groupId);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }

    /**
     * Helper method to format item names for display
     */
    static formatItemName(itemId) {
        return itemId.split(':')[1]
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Generates standard display text for requirements
     */
    static generateRequirementText(requirement) {
        return `${requirement.amount}x ${this.formatItemName(requirement.itemId)}`;
    }

    /**
     * Helper method to check if a collection exists in any group
     */
    static async collectionExists(collectionId) {
        for (const groupId of CollectionGroupManager.getGroupIds()) {
            const collections = CollectionManager.getCollectionsByGroup(groupId);
            if (collections.some(c => c.id === collectionId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Formats collection requirements for display
     */
    static formatRequirements(requirements) {
        return requirements.map(req => this.generateRequirementText(req)).join('\n');
    }

    /**
     * Formats collection rewards for display
     */
    static formatRewards(rewards) {
        return rewards.map(reward => `§7- ${reward.displayText}`).join('\n');
    }
}
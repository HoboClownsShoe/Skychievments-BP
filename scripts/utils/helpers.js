// scripts/utils/helpers.js
import { world } from '@minecraft/server';
import { Logger } from './logger.js';
import { CollectionManager, CollectionStorage, CollectionHandler, CollectionGroupManager } from '../managers/collectionsManager';

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

// /scripts/utils/statValueFormatter.js

export class StatValueFormatter {
    /**
     * Formats a statistical value based on its type
     * @param {number} value - The raw value to format
     * @param {string} type - The type of statistic ('int', 'float', 'distance', 'time')
     * @returns {string} The formatted value with appropriate units
     */
    static formatStatValue(value, type) {
        switch (type) {
            case 'int':
                return value.toFixed();
                
            case 'float':
                return value.toFixed(2);

            case 'walk':
            case 'distance':
                if (value >= 1e5) { // 100,000 cm = 1 km
                    return `${(value / 1e5).toFixed(2)}km`;
                } else if (value >= 100) { // 100 cm = 1 m
                    return `${(value / 100).toFixed(2)}m`;
                }
                return `${value.toFixed(2)}cm`;
                
            case 'time':
                const seconds = Math.floor(value / 20); // Convert ticks to seconds
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                
                if (hours > 0) {
                    return `${hours}h ${minutes % 60}m`;
                }
                return `${minutes}m ${seconds % 60}s`;
            case 'event':
                return value;

            default:
                return value.toString();
        }
    }
}


const PLAYER_EYE_HEIGHT = 1.62001002;

function stringifyLocation(location, precision = 2) {
    return '[' + location.x.toFixed(precision) + ' ' + location.y.toFixed(precision) + ' ' + location.z.toFixed(precision) + ']';
}

function subtractVectors(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function makeVector3(x, y, z) {
    if (Number(x) === x && Number(y) === y && Number(z) === z)
        return { x: x, y: y, z: z };
    else
        throw new Error(`Invalid vector coordinates: ${x}, ${y}, ${z}`);
}

function getLookAtLocation(baseLocation, targetRotation) {
    const extraDistance = 1000;
    const pitch = targetRotation.x;
    const yaw = targetRotation.y + 90;
    const xz = Math.cos(pitch * Math.PI / 180);
    const x = xz * Math.cos(yaw * Math.PI / 180) * extraDistance;
    const y = Math.sin(-pitch * Math.PI / 180) * extraDistance;
    const z = xz * Math.sin(yaw * Math.PI / 180) * extraDistance;
    return { x: baseLocation.x + x, y: baseLocation.y + y + PLAYER_EYE_HEIGHT, z: baseLocation.z + z };
}

function getLookAtRotation(baseLocation, targetLocation) {
    const x = targetLocation.x - baseLocation.x;
    const y = targetLocation.y - baseLocation.y - PLAYER_EYE_HEIGHT;
    const z = targetLocation.z - baseLocation.z;
    const yaw = Math.atan2(z, x) * 180 / Math.PI - 90;
    const xz = Math.sqrt(x * x + z * z);
    const pitch = -Math.atan2(y, xz) * 180 / Math.PI;
    return { x: pitch, y: yaw };
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function swapSlots(player, slotNumber1, slotNumber2) {
    const invContainer = player?.getComponent('minecraft:inventory')?.container;
    if (!invContainer)
        throw new Error('[Understudy] Player does not have an inventory container.');
    const slot1 = invContainer.getItem(slotNumber1);
    const slot2 = invContainer.getItem(slotNumber2);
    invContainer.setItem(slotNumber1, slot2);
    invContainer.setItem(slotNumber2, slot1);
}

function broadcastActionBar(message, sender) {
    let players;
    if (sender) players = world.getPlayers({ excludeNames: [sender.name] });
    else players = world.getAllPlayers();
    players.forEach(player => player?.onScreenDisplay.setActionBar(message));
}



export { 
    PLAYER_EYE_HEIGHT, stringifyLocation, subtractVectors, makeVector3, getLookAtLocation, isNumeric, getLookAtRotation, swapSlots, broadcastActionBar
};
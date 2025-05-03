// RequirementChecker.js - A unified system for checking all requirement types
import { Logger } from '../utils/logger.js';
import { StatisticsManager } from './statisticsManager.js';
import { itemDatabase } from './itemManager.js';
import { TimerTracker } from './timerManager.js';

/**
 * Centralized system for verifying requirement completion across the addon.
 * This operates independently of milestone progression logic.
 */
export class RequirementChecker {
    /**
     * Check if a single requirement is met for a player
     * @param {object} player - The player to check
     * @param {object} requirement - The requirement definition
     * @returns {object} Result including current value and completion status
     */
    static checkRequirement(player, requirement) {
        try {
            const checkerFunction = this.#getCheckerFunction(requirement.type);
            if (!checkerFunction) {
                Logger.log(`Unknown requirement type: ${requirement.type}`, "ERROR", "REQUIREMENT_CHECKER");
                return { currentValue: 0, isCompleted: false, error: `Unknown type: ${requirement.type}` };
            }

            Logger.log(`Checking Requirements for ${requirement.tierId}`, "DEBUG", "REQUIREMENT_CHECKER")

            const currentValue = checkerFunction(player, requirement);
            const isCompleted = currentValue >= requirement.amount;

            return {
                currentValue,
                isCompleted,
                type: requirement.type
            };
        } catch (error) {
            Logger.log(`Error checking requirement: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return { currentValue: 0, isCompleted: false, error: error.message };
        }
    }

    /**
     * Check multiple requirements for a player
     * @param {object} player - The player to check
     * @param {array} requirements - Array of requirement definitions
     * @returns {object} Results with individual requirement status and overall completion
     */
    static checkRequirements(player, requirements) {
        const results = [];
        let allCompleted = true;

        for (const requirement of requirements) {
            const result = this.checkRequirement(player, requirement);
            results.push(result);
            
            if (!result.isCompleted) {
                allCompleted = false;
            }
        }

        return {
            requirements: results,
            allCompleted
        };
    }

    /**
     * Get the appropriate checker function for a requirement type
     * @private
     * @param {string} type - The requirement type
     * @returns {function} The checker function
     */
    static #getCheckerFunction(type) {
        const checkers = {
            // Block interaction checkers                       
            'anyBlock': this.#onBreakAnyBlock,
            
            // Category checkers
            'onBreak': this.#onBreak,
            'onBreakAnyInCategory': this.#onBreakAnyInCategory,
            'onBreakAllInCategory': this.#onBreakAllInCategory,

             // Category checkers (Placing)
            'onPlace': this.#onPlace,
            'onPlaceAnyInCategory': this.#onPlaceAnyInCategory, // Added
            'onPlaceAllInCategory': this.#onPlaceAllInCategory, // Added
            
            // Collection checkers
            'collect': this.#collect,
            'collectAnyInCategory': this.#checkCollectAnyInCategory,
            'collectAllInCategory': this.#checkCollectAllInCategory,
            
            // Tool checkers
            'breakTool': this.#checkBreakTool,
            'anyBrokenToolInCategory': this.#checkAnyBrokenToolInCategory,
            'allBrokenToolInCategory': this.#checkAllBrokenToolInCategory,            
            
            // Entity interaction checkers
            'kill': this.#checkKill,
            'killAnyInCategory': this.#checkKillAnyInCategory,
            'killAllInCategory': this.#checkKillAllInCategory,
            'anyMob': this.#checkAnyMob,
            
            // Movement checkers
            'walk': this.#checkWalk,
            'run': this.#checkRun,
            'sneek': this.#checkSneek,
            'fly': this.#checkFly,
            'climb': this.#checkClimb,

             // Time-based checkers
            'timePassedSince': this.#checkTimePassedSince,

            // food checkers
            'onEat': this.#onEat,
            'onEatAnyInCategory': this.#onEatAnyInCategory,
            'onEatAllInCategory': this.#onEatAllInCategory,

            // dimension checkers
            'dimensionChange': this.#onDimensionChange,

            // Submit checkers
            'submit': this.submit,
            'submitAnyInCategory': this.submitAnyInCategory,
            'submitAllInCategory': this.submitAllInCategory
            // Add new checkers here when expanding
        };

        return checkers[type];
    }

    // CHECKER IMPLEMENTATIONS
    // Each checker returns the current value for the given requirement
    
    /**
 * Handles submission of items for 'submit' requirements.
 * Only counts items without removing them, as removal happens in MilestoneHandler.
 * @param {object} player
 * @param {object} requirement - { type: 'submit', itemId, amount }
 * @returns {number} Number of items found for submission
 */
static submit(player, requirement) {
    try {
        const inv = player.getComponent('inventory').container;
        let count = 0;
        
        // Count how many of the required item the player has
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (item && item.typeId === requirement.itemId) {
                count += item.amount;
            }
        }
        
        const amountToSubmit = Math.min(count, requirement.amount);
        return amountToSubmit;
    } catch (e) {
        Logger.log(`Error in submit requirement: ${e}`, "ERROR", "REQUIREMENT_SUBMIT");
        return 0;
    }
}

/**
 * Checks if the player has the required amount of ANY ONE item in the category.
 * @param {object} player
 * @param {object} requirement - { type: 'submitAnyInCategory', category, amount }
 * @returns {number} Number of items found for submission
 */
static submitAnyInCategory(player, requirement) {
    try {
        const inv = player.getComponent('inventory').container;
        const itemDb = itemDatabase.getInstance();
        const items = itemDb.getBlocksByCategory(requirement.category);
        const validItemIds = new Set(Object.keys(items));

        // Track counts for each valid item type
        let itemCounts = {};

        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (item && validItemIds.has(item.typeId)) {
                if (!itemCounts[item.typeId]) {
                    itemCounts[item.typeId] = 0;
                }
                itemCounts[item.typeId] += item.amount;
            }
        }

        // Find the item with the highest count
        let bestItemId = null;
        let maxCount = 0;
        for (const itemId of Object.keys(itemCounts)) {
            if (itemCounts[itemId] > maxCount) {
                maxCount = itemCounts[itemId];
                bestItemId = itemId;
            }
        }

        const amountToSubmit = Math.min(maxCount, requirement.amount);
        
        // Store which item was chosen for submission in the requirement object
        // This will be used by MilestoneHandler.handleSubmitRequirement
        requirement._submissionItem = bestItemId;
        requirement._submissionAmount = amountToSubmit;
        
        return amountToSubmit;
    } catch (e) {
        Logger.log(`Error in submitAnyInCategory: ${e}`, "ERROR", "REQUIREMENT_SUBMIT");
        return 0;
    }
}

    /**
     * Checks if the player has any items from the category that can be contributed toward
     * the requirement. Allows partial submission of each item type, with progress tracked individually.
     * @param {object} player
     * @param {object} requirement - { type: 'submitAllInCategory', category, amount }
     * @param {object} progress - Current progress data (optional, for checking existing submissions)
     * @returns {object} Information about available items for submission
     */
    static submitAllInCategory(player, requirement, progress = null) {
        try {
            const inv = player.getComponent('inventory').container;
            const itemDb = itemDatabase.getInstance();
            const items = itemDb.getBlocksByCategory(requirement.category);
            const validItemIds = new Set(Object.keys(items));

            // Track how much of each category item is found
            let itemCounts = {};
            let submissionItems = [];
            let totalToSubmit = 0;
            
            // Count all valid items in inventory
            for (let i = 0; i < inv.size; i++) {
                const item = inv.getItem(i);
                if (item && validItemIds.has(item.typeId)) {
                    if (!itemCounts[item.typeId]) {
                        itemCounts[item.typeId] = 0;
                    }
                    itemCounts[item.typeId] += item.amount;
                }
            }

            // For each item in the category, determine how much can be submitted
            for (const itemId of validItemIds) {
                const count = itemCounts[itemId] || 0;
                
                // If we have progress data, check how much more is needed for this item
                let neededAmount = requirement.amount;
                if (progress && progress[itemId]) {
                    neededAmount = Math.max(0, requirement.amount - progress[itemId]);
                }
                
                const amountToSubmit = Math.min(count, neededAmount);
                
                if (amountToSubmit > 0) {
                    submissionItems.push({
                        itemId: itemId,
                        amount: amountToSubmit,
                        neededAmount: neededAmount
                    });
                    
                    totalToSubmit += amountToSubmit;
                }
            }
            
            // Calculate if all items have met the requirement (including previous progress)
            let allCompleted = true;
            for (const itemId of validItemIds) {
                // Get current progress for this item
                let currentProgress = (progress && progress[itemId]) || 0;
                
                // Add new submission for this item (if any)
                const submissionItem = submissionItems.find(item => item.itemId === itemId);
                const newAmount = submissionItem ? submissionItem.amount : 0;
                
                // Check if this item meets the requirement
                if (currentProgress + newAmount < requirement.amount) {
                    allCompleted = false;
                    break;
                }
            }
            
            // Store submission details for MilestoneHandler
            requirement._submissionItems = submissionItems;
            requirement._allCompleted = allCompleted;
            
            return {
                amount: totalToSubmit,
                submissionItems: submissionItems,
                allCompleted: allCompleted
            };
        } catch (e) {
            Logger.log(`Error in submitAllInCategory: ${e}`, "ERROR", "REQUIREMENT_SUBMIT");
            return {
                amount: 0,
                submissionItems: [],
                allCompleted: false
            };
        }
    }

    // --- Block Interaction Checkers ---

    //#region --- Block Break Checkers ---

    /**
         * Checks how many times a specific block type has been mined.
         * Requirement: { type: "break", itemId: "minecraft:stone", amount: 10 }
         * @param {object} player - The player object.
         * @param {object} requirement - The requirement definition.
         * @returns {number} The number of times the specified block was mined.
         */
    static #onBreak(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.blockMined.getBlockType(requirement.itemId);
    }


    /**
     * Checks the total number of *any* blocks mined by the player.
     * Requirement: { type: "anyBlock", amount: 1000 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The total count of blocks mined.
     */
    static #onBreakAnyBlock(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        // Note: This uses the vanilla statistic which might include blocks broken by tools vs hand.
        return stats.custom.getCustomStat("minecraft:blocks_mined");
    }

    /**
     * Checks the highest count for *any single block type* within a specified category that the player has mined.
     * Example: If category "ores" has iron (mined 10 times) and coal (mined 20 times), this returns 20.
     * Requirement: { type: "onBreakAnyInCategory", category: "ores", amount: 15 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The maximum mined count among blocks in the category.
     */
    static #onBreakAnyInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const blocksInCategory = itemDb.getBlocksByCategory(requirement.category);

            let highestCount = 0;

            for (const blockData of Object.values(blocksInCategory)) {
                const blockId = blockData.id;
                const count = stats.blockMined.getBlockType(blockId);
                
                // Update the highest count if this block has been mined more
                if (count > highestCount) {
                    highestCount = count;
                }
            }

            return highestCount;
        } catch (error) {
            Logger.log(`Error checking any in category ${requirement.category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    /**
     * Checks if *all* block types within a specified category have been mined at least 'amount' times.
     * Requirement: { type: "onBreakAllInCategory", category: "logs", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} 1 if all blocks in the category meet the amount, 0 otherwise.
     */
    static #onBreakAllInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const blocksInCategory = itemDb.getBlocksByCategory(requirement.category);

            for (const blockData of Object.values(blocksInCategory)) {
                const blockId = blockData.id;
                const minedCount = stats.blockMined.getBlockType(blockId);

                if (minedCount < requirement.amount) {
                    return 0; // At least one block hasn't been mined enough times
                }
            }
            
            return 1;
        } catch (error) {
            Logger.log(`Error checking all in category ${requirement.category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    //#endregion

    //#region --- Block Place Checkers

    /**
     * Checks how many times a specific block type has been placed.
     * Requirement: { type: "place", itemId: "minecraft:dirt", amount: 5 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The number of times the specified block was placed.
     */
    static #onPlace(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.blockPlaced.getBlockType(requirement.itemId);
    }

    /**
     * Checks the highest count for *any single block type* within a specified category that the player has placed.
     * Requirement: { type: "placeAnyInCategory", category: "wool", amount: 10 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The maximum placed count among blocks in the category.
     */
    static #onPlaceAnyInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const blocksInCategory = itemDb.getBlocksByCategory(requirement.category);

            let highestCount = 0;

            for (const blockData of Object.values(blocksInCategory)) {
                const blockId = blockData.id;
                // Use blockPlaced statistic
                const count = stats.blockPlaced.getBlockType(blockId); 
                
                if (count > highestCount) {
                    highestCount = count;
                }
            }

            return highestCount;
        } catch (error) {
            Logger.log(`Error checking place any in category ${requirement.category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    /**
     * Checks if *all* block types within a specified category have been placed at least 'amount' times.
     * Requirement: { type: "placeAllInCategory", category: "planks", amount: 5 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} 1 if all blocks in the category meet the placed amount, 0 otherwise.
     */
    static #onPlaceAllInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const blocksInCategory = itemDb.getBlocksByCategory(requirement.category);

            if (Object.keys(blocksInCategory).length === 0) {
                Logger.log(`Category ${requirement.category} is empty or not found for placeAllInCategory check.`, "WARN", "STATISTICS");
                return 0; // Cannot fulfill requirement if category is empty
            }

            for (const blockData of Object.values(blocksInCategory)) {
                const blockId = blockData.id;
                 // Use blockPlaced statistic
                const placedCount = stats.blockPlaced.getBlockType(blockId);

                if (placedCount < requirement.amount) {
                    return 0; // At least one block hasn't been placed enough times
                }
            }
            
            // All blocks in the category have been placed at least the required amount
            return 1; 
        } catch (error) {
            Logger.log(`Error checking place all in category ${requirement.category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    //#endregion

    //#region --- Collection Checkers (Based on Inventory) ---

    /**
     * Checks the total amount of a specific item the player possesses in their inventory.
     * Requirement: { type: "collect", itemId: "minecraft:cobblestone", amount: 64 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The total amount of the specified item in the inventory.
     */
    static #collect(player, requirement) {
        const container = player.getComponent('inventory').container;
        let count = 0;
        
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && item.typeId === requirement.itemId) {
                count += item.amount;
            }
        }
        
        return count;
    }

    /**
     * Checks if the player possesses at least one item from a specified category.
     * Requirement: { type: "collectAnyInCategory", category: "flowers", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition (amount usually 1).
     * @returns {number} 1 if at least one item from the category is found, 0 otherwise.
     */
    static #checkCollectAnyInCategory(player, requirement) {
        const container = player.getComponent('inventory').container;
        const itemDb = itemDatabase.getInstance();
        const categoryItems = itemDb.getBlocksByCategory(requirement.category);
        
        if (Object.keys(categoryItems).length === 0) {
            return 0;
        }
        
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && categoryItems[item.typeId]) {
                return 1; // Found at least one
            }
        }
        
        return 0;
    }

    /**
     * Checks if the player possesses at least one of *every* item type within a specified category.
     * Requirement: { type: "collectAllInCategory", category: "wool", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition (amount usually 1).
     * @returns {number} 1 if all item types in the category are present, 0 otherwise.
     */
    static #checkCollectAllInCategory(player, requirement) {
        const container = player.getComponent('inventory').container;
        const itemDb = itemDatabase.getInstance();
        const allCategoryItems = itemDb.getBlocksByCategory(requirement.category);
        const categoryItemIds = Object.keys(allCategoryItems);
        
        if (categoryItemIds.length === 0) {
            return 0;
        }
        
        const foundItemIds = new Set();
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && allCategoryItems[item.typeId]) {
                foundItemIds.add(item.typeId);
            }
        }
        
        return (foundItemIds.size === categoryItemIds.length) ? 1 : 0;
    }

    //#endregion

    //#region --- Tool Checkers ---

    /**
     * Checks how many times a specific tool type has been broken.
     * Requirement: { type: "breakTool", itemId: "minecraft:iron_pickaxe", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The number of times the specified tool has broken.
     */
    static #checkBreakTool(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            return stats.toolBroken.getToolBreakCount(requirement.itemId);
        } catch (error) {
            Logger.log(`Error in checkBreakTool: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return 0;
        }
    }

    /**
     * Checks the total number of times *any* tool within a specified category has been broken.
     * Requirement: { type: "anyBrokenToolInCategory", category: "pickaxes", amount: 5 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The total break count for all tools in the category.
     */
    static #checkAnyBrokenToolInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            return stats.toolBroken.getToolsBreakInCategory(requirement.category);
        } catch (error) {
            Logger.log(`Error in checkAnyBrokenToolInCategory: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return 0;
        }
    }

    /**
     * Checks if *all* tool types within a specified category have been broken at least 'amount' times.
     * Requirement: { type: "allBrokenToolInCategory", category: "hoes", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} 1 if all tools in the category meet the break amount, 0 otherwise.
     */
    static #checkAllBrokenToolInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            // Note: The original logic returned requirement.amount if true, which seems odd. Returning 1 for true.
            return stats.toolBroken.haveAllToolsInCategoryBroken(requirement.category) ? 1 : 0;
        } catch (error) {
            Logger.log(`Error in checkAllBrokenToolInCategory: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return 0;
        }
    }

    //#endregion

    //#region --- Entity Kill Checkers ---

    /**
     * Checks how many times a specific entity type has been killed by the player.
     * Requirement: { type: "kill", itemId: "minecraft:zombie", amount: 50 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The number of times the specified entity was killed.
     */
    static #checkKill(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.entityKilled.getKillCount(requirement.itemId);
    }

    /**
     * Checks the total kill count across *all* entity types within a specified category.
     * Requirement: { type: "killAnyInCategory", category: "undead", amount: 100 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition with category and amount.
     * @returns {number} The total kill count across all entities in the category.
     */

    static #checkKillAnyInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const entitiesInCategory = itemDb.getEntitiesByCategory(requirement.category);
            
            let totalKilled = 0;
            
            for (const entityId of Object.keys(entitiesInCategory)) {
                const killCount = stats.entityKilled.getKillCount(entityId);
                totalKilled += killCount;
                
                // Optionally break early if we're just checking for "any"
                if (requirement.checkType === 'any' && totalKilled >= requirement.amount) {
                    break;
                }
            }
            
            return totalKilled;
        } catch (error) {
            Logger.log(`Error in checkKillAnyInCategory: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return 0;
        }
    }

    /**
     * Checks if *all* entity types within a specified category have been killed at least 'amount' times.
     * Requirement: { type: "killAllInCategory", category: "passive_mobs", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition with category and amount.
     * @returns {number} 1 if all entities have been killed at least 'amount' times, 0 otherwise.
     */
  
    static #checkKillAllInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const entitiesInCategory = itemDb.getEntitiesByCategory(requirement.category);
            
            if (Object.keys(entitiesInCategory).length === 0) {
                return 0;
            }
            
            // Check if player has killed each entity type at least 'amount' times
            for (const entityId of Object.keys(entitiesInCategory)) {
                const killCount = stats.entityKilled.getKillCount(entityId);
                if (killCount < requirement.amount) {
                    return 0; // Failed to meet the requirement for at least one entity
                }
            }
            
            return 1; // All entities have been killed the required amount of times
        } catch (error) {
            Logger.log(`Error in checkKillAllInCategory: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return 0;
        }
    }

    /**
     * Checks the total number of *any* mobs killed by the player.
     * Requirement: { type: "anyMob", amount: 100 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The total count of mobs killed.
     */
    static #checkAnyMob(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        // Note: Uses the vanilla mob kill statistic.
        return stats.custom.getCustomStat("minecraft:mob_kills");
    }

    //#endregion

    //#region --- Movement Checkers ---
    // Note: These use vanilla stats measured in centimeters. Convert amount accordingly (e.g., 100 cm = 1 meter).

    /**
     * Checks the total distance walked (in cm).
     * Requirement: { type: "walk", amount: 100000 } // 1000 meters
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} Distance walked in cm.
     */
    static #checkWalk(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.custom.getCustomStat("minecraft:walk_one_cm");
    }

    /**
     * Checks the total distance sprinted (in cm).
     * Requirement: { type: "run", amount: 50000 } // 500 meters
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} Distance sprinted in cm.
     */
    static #checkRun(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.custom.getCustomStat("minecraft:sprint_one_cm");
    }

    /**
     * Checks the total distance sneaked (in cm).
     * Requirement: { type: "sneek", amount: 10000 } // 100 meters
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} Distance sneaked in cm.
     */
    static #checkSneek(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.custom.getCustomStat("minecraft:crouch_one_cm");
    }

    /**
     * Checks the total distance flown (in cm).
     * Requirement: { type: "fly", amount: 1000000 } // 10 km
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} Distance flown in cm.
     */
    static #checkFly(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.custom.getCustomStat("minecraft:fly_one_cm");
    }

    /**
     * Checks the total distance climbed (in cm).
     * Requirement: { type: "climb", amount: 5000 } // 50 meters
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} Distance climbed in cm.
     */
    static #checkClimb(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.custom.getCustomStat("minecraft:climb_one_cm");
    }

    //#endregion

    //#region  --- Time Checkers ---

    /**
     * Checks how much time (in minutes) has passed since a specific event for a tier.
     * Requirement: { type: "timePassedSince", event: "tier_activated", amount: 20 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The number of minutes that have passed since the event.
     */
    static #checkTimePassedSince(player, requirement) {
        try {
            // Get relevant data from the requirement
            const { event, milestoneId, tierId } = requirement;
            
            // Find the current milestone and tier context
            // This is more complex as we need to determine which tier this requirement belongs to
            const currentMilestoneId = milestoneId || 'global';
            
            // Generate a tier-specific event name if not provided
            let eventName = event;
            if (!eventName && tierId) {
                eventName = `${tierId}_activated`;
            } else if (!eventName) {
                eventName = 'tier_activated';
            }
            
            // If we're processing a tier requirement, we can use the tier ID
            // to create a more specific timer ID
            const timerEventName = tierId ? `${tierId}_${eventName}` : eventName;
            
            // Check if the timer has been started for this event
            if (!TimerTracker.hasTimer(player, currentMilestoneId, timerEventName)) {
                // If timer doesn't exist, start it now
                TimerTracker.startTimer(player, currentMilestoneId, timerEventName);
                Logger.log(`Started timer for ${timerEventName} in milestone ${currentMilestoneId}`, "DEBUG", "REQUIREMENT_CHECKER");
                return 0;
            }
            
            // Get the elapsed time from the timer tracker
            const elapsedMinutes = TimerTracker.getElapsedMinutes(player, currentMilestoneId, timerEventName);
            Logger.log(`Time passed since ${timerEventName} for milestone ${currentMilestoneId}: ${elapsedMinutes} minutes`, "DEBUG", "REQUIREMENT_CHECKER");
            
            return elapsedMinutes;
        } catch (error) {
            Logger.log(`Error checking timePassedSince: ${error}`, "ERROR", "REQUIREMENT_CHECKER");
            return 0;
        }
    }

    //#endregion

    //#region --- Eaten Checkers ---

    /**
         * Checks how many times a specific food item has been consumed.
         * Requirement: { type: "break", itemId: "minecraft:stone", amount: 10 }
         * @param {object} player - The player object.
         * @param {object} requirement - The requirement definition.
         * @returns {number} The number of times the specified block was mined.
         */
    static #onEat(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.thingsEaten.getItemType(requirement.itemId);
    }

    /**
     * Checks the highest count for *any single food type* within a specified category that the player has eaten.
     * Example: If category "ores" has iron (mined 10 times) and coal (mined 20 times), this returns 20.
     * Requirement: { type: "onBreakAnyInCategory", category: "ores", amount: 15 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} The maximum mined count among blocks in the category.
     */
    static #onEatAnyInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const foodInCategory = itemDb.getBlocksByCategory(requirement.category);

            let highestCount = 0;

            for (const foodData of Object.values(foodInCategory)) {
                const foodId = foodData.id;
                const count = stats.thingsEaten.getItemType(foodId);
                
                // Update the highest count if this block has been mined more
                if (count > highestCount) {
                    highestCount = count;
                }
            }

            return highestCount;
        } catch (error) {
            Logger.log(`Error checking any in category ${requirement.category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    /**
     * Checks if *all* food types within a specified category have been eaten at least 'amount' times.
     * Requirement: { type: "onBreakAllInCategory", category: "logs", amount: 1 }
     * @param {object} player - The player object.
     * @param {object} requirement - The requirement definition.
     * @returns {number} 1 if all blocks in the category meet the amount, 0 otherwise.
     */
    static #onEatAllInCategory(player, requirement) {
        try {
            const stats = StatisticsManager.getPlayerStats(player);
            const itemDb = itemDatabase.getInstance();
            const foodInCategory = itemDb.getBlocksByCategory(requirement.category);

            for (const foodData of Object.values(foodInCategory)) {
                const foodId = foodData.id;
                const eatenCount = stats.thingsEaten.getItemType(foodId);

                if (eatenCount < requirement.amount) {
                    return 0; // At least one block hasn't been mined enough times
                }
            }
            
            return 1;
        } catch (error) {
            Logger.log(`Error checking all in category ${requirement.category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    //#endregion

    //#region --- Dimension Checkers ---

    /**
         * Checks how many times a specific food item has been consumed.
         * Requirement: { type: "break", itemId: "minecraft:stone", amount: 10 }
         * @param {object} player - The player object.
         * @param {object} requirement - The requirement definition.
         * @returns {number} The number of times the specified block was mined.
         */
    static #onDimensionChange(player, requirement) {
        const stats = StatisticsManager.getPlayerStats(player);
        return stats.dimensionChange.getDimensionChange(requirement.dimension);
    }

    //#endregion

    // Extension point: Add more checker methods here as needed
}

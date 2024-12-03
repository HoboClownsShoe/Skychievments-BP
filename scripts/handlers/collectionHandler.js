// scripts/handlers/collectionHandler.js
import { world } from '@minecraft/server';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';

// In collectionHandler.js

export class CollectionHandler {
static async checkGroupProgress(player, groupId) {
    try {
        Logger.log(`Checking ${player.name}'s progress for group ${groupId}`, "INFO", "COLLECTIONS");
        
        const container = player.getComponent('inventory').container;
        const collections = CollectionManager.getEnabledCollections()
            .filter(c => c.parentId === groupId);

        // Get or initialize player progress
        let progress = await this.getPlayerProgress(player);
        if (!progress) {
            progress = {};
        }

        let claimableCollections = [];

        // Single inventory scan for all collections in group
        const inventoryCounts = {};
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) {
                inventoryCounts[item.typeId] = (inventoryCounts[item.typeId] || 0) + item.amount;
                Logger.log(`Found ${item.amount}x ${item.typeId} in inventory`, "DEBUG", "COLLECTIONS");
            }
        }

        // Check each collection against counted inventory
        for (const collection of collections) {
            // Check if collection has valid requirements
            if (!collection.requirements || !Array.isArray(collection.requirements)) {
                Logger.log(`Invalid requirements for collection ${collection.id}`, "ERROR", "COLLECTIONS");
                continue;
            }

            // Initialize progress for this collection if it doesn't exist
            if (!progress[collection.id]) {
                progress[collection.id] = {
                    requirements: collection.requirements.map(req => ({
                        itemId: req.itemId,
                        amount: 0,
                        completed: false
                    })),
                    completed: false
                };
            }

            if (progress[collection.id].completed) continue;

            let allRequirementsMet = true;
            let updatedAmounts = false;

            // Check each requirement
            for (let i = 0; i < collection.requirements.length; i++) {
                const requirement = collection.requirements[i];
                const currentCount = inventoryCounts[requirement.itemId] || 0;

                // Ensure progress requirements array exists and has this index
                if (!progress[collection.id].requirements[i]) {
                    progress[collection.id].requirements[i] = {
                        itemId: requirement.itemId,
                        amount: 0,
                        completed: false
                    };
                }

                const progressAmount = progress[collection.id].requirements[i].amount;

                // Update progress if amount changed
                if (progressAmount !== currentCount) {
                    progress[collection.id].requirements[i].amount = currentCount;
                    updatedAmounts = true;
                }

                if (currentCount < requirement.amount) {
                    allRequirementsMet = false;
                }
            }

            if (allRequirementsMet) {
                claimableCollections.push({
                    collection,
                    currentAmounts: progress[collection.id].requirements
                });
            }

            if (updatedAmounts) {
                await this.savePlayerProgress(player, progress);
            }
        }

        return {
            claimableCollections,
            progress
        };

    } catch (error) {
        Logger.log(`Error checking group progress: ${error}`, "ERROR", "COLLECTIONS");
        return { claimableCollections: [], progress: {} };
    }
}

    static async claimCollection(player, collection) {
        try {
            Logger.log(`Claiming collection ${collection.displayName} for player ${player.name}`, "INFO", "COLLECTIONS");

            // Check all requirements are met
            const container = player.getComponent('inventory').container;
            const inventoryCounts = {};
            
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item) {
                    inventoryCounts[item.typeId] = (inventoryCounts[item.typeId] || 0) + item.amount;
                }
            }

            // Verify all requirements
            for (const requirement of collection.requirements) {
                const currentCount = inventoryCounts[requirement.itemId] || 0;
                if (currentCount < requirement.amount) {
                    return {
                        success: false,
                        message: `§cNot enough ${requirement.itemId.split(':')[1].replace(/_/g, ' ')}! (${currentCount}/${requirement.amount})`
                    };
                }
            }

            // Update progress
            const progress = await this.getPlayerProgress(player);
            progress[collection.id] = {
                requirements: collection.requirements.map(req => ({
                    itemId: req.itemId,
                    amount: req.amount,
                    completed: true
                })),
                completed: true,
                completedAt: Date.now()
            };
            
            await this.savePlayerProgress(player, progress);

            // Grant rewards
            for (const reward of collection.rewards) {
                try {
                    if (reward.type === 'command') {
                        await player.runCommandAsync(reward.command);
                    } else if (reward.type === 'item') {
                        await player.runCommandAsync(`give @p ${reward.itemId} ${reward.amount}`);
                    }
                    Logger.log(`Granted reward: ${reward.displayText}`, "DEBUG", "COLLECTIONS");
                } catch (rewardError) {
                    Logger.log(`Failed to grant reward: ${rewardError}`, "ERROR", "COLLECTIONS");
                }
            }

            // Format reward message
            const rewardMessage = collection.rewards
                .map(r => r.displayText)
                .join('\n§7- ');

            return {
                success: true,
                message: `§a§lCollection Complete! §r§a${collection.displayName}\n§7Rewards:\n§7- ${rewardMessage}`
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
            const progress = world.getDynamicProperty(`progress_${player.id}`);
            Logger.log(`Got progress for player ${player.name}: ${progress}`, "DEBUG", "COLLECTIONS");
            return progress ? JSON.parse(progress) : {};
        } catch (error) {
            Logger.log(`Error getting player progress: ${error}`, "ERROR", "COLLECTIONS");
            return {};
        }
    }

    static async savePlayerProgress(player, progress) {
        try {
            world.setDynamicProperty(`progress_${player.id}`, JSON.stringify(progress));
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
}
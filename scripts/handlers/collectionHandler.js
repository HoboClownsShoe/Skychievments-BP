// scripts/handlers/collectionHandler.js
import { world } from '@minecraft/server';
import { CollectionManager } from '../config/collections.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';
import { Logger } from '../utils/logger.js';

// In collectionHandler.js

export class CollectionHandler {

    static async checkGroupProgress(player, groupId) {
        try {
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                Logger.log(`Invalid group ID ${groupId} for progress check`, "ERROR", "COLLECTIONS");
                return { claimableCollections: [], progress: {} };
            }

            Logger.log(`Checking ${player.name}'s progress for group ${groupId}`, "DEBUG", "COLLECTIONS");
            
            // Get all collections for this group
            const collections = CollectionManager.getEnabledCollections()
                .filter(c => c.parentId === groupId);

            if (collections.length === 0) {
                Logger.log(`No collections found for group ${groupId}`, "DEBUG", "COLLECTIONS");
                return { claimableCollections: [], progress: {} };
            }

            // Get player progress
            let progress = await this.getPlayerProgress(player);
            if (!progress) {
                progress = {};
            }

            // Single inventory scan for the entire group
            const container = player.getComponent('inventory').container;
            const inventoryCounts = {};
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item) {
                    inventoryCounts[item.typeId] = (inventoryCounts[item.typeId] || 0) + item.amount;
                }
            }

            const claimableCollections = [];

            // Compare inventory against each collection's requirements
            for (const collection of collections) {
                try {
                    // Skip if already completed
                    if (progress[collection.id]?.completed) continue;

                    // Initialize collection progress if needed
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

                    let allRequirementsMet = true;
                    let updatedAmounts = false;

                    // Update progress and check if all requirements are met
                    for (let i = 0; i < collection.requirements.length; i++) {
                        const requirement = collection.requirements[i];
                        const currentCount = inventoryCounts[requirement.itemId] || 0;

                        // Update progress if amount changed
                        if (progress[collection.id].requirements[i].amount !== currentCount) {
                            progress[collection.id].requirements[i].amount = currentCount;
                            updatedAmounts = true;
                        }

                        if (currentCount < requirement.amount) {
                            allRequirementsMet = false;
                        }
                    }

                    // If all requirements are met, add to claimable collections
                    if (allRequirementsMet) {
                        claimableCollections.push({
                            collection,
                            requirements: progress[collection.id].requirements
                        });
                    }

                    // Save updated progress if needed
                    if (updatedAmounts) {
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
            let message = `§a§lCollection Complete! §r§a${collection.displayName}\n`;
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
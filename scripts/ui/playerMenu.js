// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';
import { Logger } from '../utils/logger.js';


export class PlayerMenu {
    static async showMainMenu(player) {
        try {
            // Initialize/update player collections first
            const allCollections = CollectionManager.getEnabledCollections();
            const progress = await CollectionHandler.getCompletedCollections(player);
            
            const menu = new ActionFormData()
                .title("Skychievments")
                .body("§7Select a category to view:\n");

            // Get groups in correct order using CollectionGroupManager
            const orderedGroups = CollectionGroupManager.getGroupIds()
                .map(id => CollectionGroupManager.getGroupById(id));

            // Add group buttons with collection counts
            orderedGroups.forEach(group => {
                const groupCollections = allCollections.filter(c => c.parentId === group.id);
                const totalInGroup = groupCollections.length;
                const completedInGroup = progress.filter(completed => 
                    groupCollections.some(c => c.id === completed.id)
                ).length;

                menu.button(
                    `${group.displayName}\n§8${completedInGroup}/${totalInGroup}`,
                    group.icon
                );
            });

            const response = await menu.show(player);
            
            if (!response.canceled && response.selection < orderedGroups.length) {
                await this.showGroupCollections(player, orderedGroups[response.selection]);
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showGroupCollections(player, group) {
        try {
            if (!CollectionGroupManager.isValidGroupId(group.id)) {
                Logger.log(`Invalid group ID: ${group.id}`, "ERROR", "PLAYER_UI");
                return;
            }

            // Get all collection data for this group in one check
            const { claimableCollections, progress } = await CollectionHandler.checkGroupProgress(player, group.id);
            
            const allCollections = CollectionManager.getEnabledCollections()
                .filter(c => c.parentId === group.id)
                .sort((a, b) => a.order - b.order);

            // Create lookup map for claimable collections
            const claimableMap = new Map(
                claimableCollections.map(cc => [cc.collection.id, cc])
            );

            // Separate collections
            const uncompletedCollections = allCollections.filter(c => !progress[c.id]?.completed);
            const completedCollections = allCollections.filter(c => progress[c.id]?.completed);

            // Build the body text
            let completedText = completedCollections.length > 0 ? 
                "\n§2§lCompleted:§r\n" + completedCollections
                    .map(c => `§7- ${c.displayName}`)
                    .join('\n') + '\n' : '';

            const menu = new ActionFormData()
                .title(group.displayName)
                .body(`${group.description}${completedText}\n`);

            // Add uncompleted collections as buttons
            if (uncompletedCollections.length > 0) {
                uncompletedCollections.forEach(collection => {
                    const collectionProgress = progress[collection.id];
                    const claimableData = claimableMap.get(collection.id);
                    let progressText = '';

                    // Build progress text for each requirement
                    collection.requirements.forEach((req, index) => {
                        const current = collectionProgress?.requirements[index]?.amount || 0;
                        progressText += `\n${claimableData ? '§a' : '§6'}${current}/${req.amount} ${req.itemId.split(':')[1]}`;
                    });

                    menu.button(
                        `${collection.displayName}${progressText}${claimableData ? '\n§a(Claim It!)' : ''}`
                    );
                });
            } else {
                menu.button("§cNo Active Collections\n§8All collections completed!");
            }

            menu.button("Back to Menu\n§8Return to main menu");

            const response = await menu.show(player);
            
            if (response.canceled) return;

            const lastButtonIndex = uncompletedCollections.length > 0 ? uncompletedCollections.length : 1;

            if (response.selection === lastButtonIndex) {
                await this.showMainMenu(player);
                return;
            }

            if (uncompletedCollections.length > 0) {
                const selectedCollection = uncompletedCollections[response.selection];
                const claimableData = claimableMap.get(selectedCollection.id);
                await this.showCollectionDetails(player, selectedCollection, claimableData);
            }

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCollectionDetails(player, collection, claimableData) {
        try {
            // Build requirements text using progress data
            const requirementsText = collection.requirements.map((req, index) => {
                const current = claimableData?.requirements[index]?.amount || 0;
                return `§7${req.itemId.split(':')[1]}: ${claimableData ? '§a' : '§f'}${current}/${req.amount}`;
            }).join('\n');

            // Build rewards text
            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Requirements:${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}`
                );

            if (claimableData) {
                menu.button("Claim Reward\n§8Collect your reward!");
            }
            menu.button("Back\n§8Return to collections");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            if (response.selection === 0 && claimableData) {
                const result = await CollectionHandler.claimCollection(player, claimableData);
                player.sendMessage(result.message);
                if (result.success) {
                    await this.showGroupCollections(player, CollectionGroupManager.getGroupById(collection.parentId));
                } else {
                    await this.showCollectionDetails(player, collection, claimableData);
                }
            } else {
                const group = CollectionGroupManager.getGroupById(collection.parentId);
                if (group) {
                    await this.showGroupCollections(player, group);
                } else {
                    Logger.log(`Group not found for collection ${collection.id}`, "ERROR", "PLAYER_UI");
                    await this.showMainMenu(player);
                }
            }
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collection details.');
        }
    }

    // Helper method to get formatted space information for a group
    static async #getGroupSpaceInfo(groupId) {
        try {
            const stats = await CollectionManager.getStorageStats(groupId);
            if (!stats || !stats[groupId]) return "§cUnable to get space info";

            const usedKB = (stats[groupId].usedSpace / 1024).toFixed(1);
            const totalKB = 32;
            const percent = stats[groupId].spaceUsedPercent;

            return `§7${usedKB}KB/${totalKB}KB (${percent}% used)`;
        } catch (error) {
            Logger.log(`Error getting group space info: ${error}`, "ERROR", "PLAYER_UI");
            return "§cUnable to get space info";
        }
    }
}
// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { COLLECTION_GROUPS } from '../config/collectionGroups.js';
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

            // Add group buttons with collection counts
            COLLECTION_GROUPS.forEach(group => {
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
            
            if (!response.canceled && response.selection < COLLECTION_GROUPS.length) {
                await this.showGroupCollections(player, COLLECTION_GROUPS[response.selection]);
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showGroupCollections(player, group) {
        try {
            const { claimableCollections, progress } = await CollectionHandler.checkGroupProgress(player, group.id);
            const allCollections = CollectionManager.getEnabledCollections()
                .filter(c => c.parentId === group.id)
                .sort((a, b) => a.order - b.order);

            // Separate collections
            const uncompletedCollections = allCollections.filter(c => !progress[c.id]?.completed);
            const completedCollections = allCollections.filter(c => progress[c.id]?.completed);

            // Build the body text for completed collections
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
                    let progressText = '';
                    let isClaimable = claimableCollections.some(c => c.collection.id === collection.id);

                    // Build progress text for each requirement
                    collection.requirements.forEach((req, index) => {
                        const current = collectionProgress?.requirements[index]?.amount || 0;
                        progressText += `\n${isClaimable ? '§a' : '§6'}${current}/${req.amount} ${req.itemId.split(':')[1]}`;
                    });

                    menu.button(
                        `${collection.displayName}${progressText}${isClaimable ? '\n§a(Claim It!)' : ''}`
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
                const isClaimable = claimableCollections.some(c => c.collection.id === selectedCollection.id);
                await this.showCollectionDetails(player, selectedCollection, isClaimable, false);
            }

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCollectionDetails(player, collection, isClaimable, isCompleted) {
        try {
            const progress = await CollectionHandler.getCollectionProgress(player, collection.id);
            
            // Build requirements text
            let requirementsText = '';
            collection.requirements.forEach((req, index) => {
                const currentAmount = progress?.requirements[index]?.amount || 0;
                requirementsText += `\n§7${req.itemId.split(':')[1]}: ${isClaimable ? '§a' : '§f'}${currentAmount}/${req.amount}`;
            });

            // Build rewards text
            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    (isCompleted ? 
                        `§2§lCOMPLETED!\n§7Completed: §f${new Date(progress.completedAt).toLocaleString()}\n` :
                        `§7Requirements:${requirementsText}\n`) +
                    `\n§7Rewards:\n${rewardsText}`
                );

            if (!isCompleted) {
                menu.button(isClaimable ? "Claim Reward\n§8Collect your reward!" : "Check Progress\n§8Update collection status");
            }
            menu.button("Back\n§8Return to collections");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    if (!isCompleted && isClaimable) {
                        const result = await CollectionHandler.claimCollection(player, collection);
                        player.sendMessage(result.message);
                        if (result.success) {
                            const group = COLLECTION_GROUPS.find(g => g.id === collection.parentId);
                            if (group) await this.showGroupCollections(player, group);
                        } else {
                            await this.showCollectionDetails(player, collection, isClaimable, isCompleted);
                        }
                    } else {
                        const group = COLLECTION_GROUPS.find(g => g.id === collection.parentId);
                        if (group) await this.showGroupCollections(player, group);
                    }
                    break;
                case 1:
                    const group = COLLECTION_GROUPS.find(g => g.id === collection.parentId);
                    if (group) {
                        await this.showGroupCollections(player, group);
                    } else {
                        Logger.log(`Group not found for collection ${collection.id}`, "ERROR", "PLAYER_UI");
                        await this.showMainMenu(player);
                    }
                    break;
            }
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collection details.');
        }
    }

    static async #initializePlayerCollections(player) {
        try {
            // Get current collections and player progress
            const currentCollections = CollectionManager.getEnabledCollections();
            let playerProgress = await CollectionHandler.getPlayerProgress(player);
            
            if (!playerProgress) {
                playerProgress = {};
            }

            const newCollections = [];
            const removedCollections = [];

            // Check for new collections
            for (const collection of currentCollections) {
                if (!playerProgress.hasOwnProperty(collection.id)) {
                    // Initialize new collection progress
                    playerProgress[collection.id] = {
                        amount: 0,
                        completed: false
                    };
                    newCollections.push(collection);
                }
            }

            // Check for removed collections
            for (const progressId in playerProgress) {
                if (!currentCollections.some(c => c.id === progressId)) {
                    // Remove progress for collections that no longer exist
                    delete playerProgress[progressId];
                    removedCollections.push(progressId);
                }
            }

            // Save updated progress if there were any changes
            if (newCollections.length > 0 || removedCollections.length > 0) {
                await CollectionHandler.savePlayerProgress(player, playerProgress);
                Logger.log(`Updated collections for ${player.name}: ${newCollections.length} new, ${removedCollections.length} removed`, "DEBUG", "PLAYER_UI");
            }

            return {
                newCollections,
                removedCollections
            };
        } catch (error) {
            Logger.log(`Error initializing player collections: ${error}`, "ERROR", "PLAYER_UI");
            return { newCollections: [], removedCollections: [] };
        }
    }
}
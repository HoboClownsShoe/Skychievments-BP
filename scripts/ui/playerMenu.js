// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { COLLECTION_GROUPS } from '../config/collectionGroups.js';
import { Logger } from '../utils/logger.js';

export class PlayerMenu {
    static async showMainMenu(player) {
        try {
            const menu = new ActionFormData()
                .title("Skychievments")
                .body("§7Select a category to view:\n");

            // Add group buttons
            COLLECTION_GROUPS.forEach(group => {
                menu.button(
                    `${group.displayName}\n§8View ${group.name} Collections`,
                    group.icon
                );
            });
            
            menu.button("Completed Collections\n§8View your achievements");
            menu.button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            if (response.selection < COLLECTION_GROUPS.length) {
                await this.showGroupCollections(player, COLLECTION_GROUPS[response.selection]);
            } else if (response.selection === COLLECTION_GROUPS.length) {
                await this.showCompletedCollections(player);
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showGroupCollections(player, group) {
        try {
            const progress = await CollectionHandler.checkProgress(player);
            const allCollections = CollectionManager.getEnabledCollections();
            
            // Filter collections for this group using parentId
            const collections = allCollections
                .filter(c => c.parentId === group.id && !progress[c.id]?.completed)
                .sort((a, b) => a.order - b.order);

            const menu = new ActionFormData()
                .title(group.displayName)
                .body(`${group.description}\n`);

            if (collections.length === 0) {
                menu.button("§cNo Active Collections\n§8Complete them all!");
            } else {
                collections.forEach(collection => {
                    const currentAmount = progress[collection.id]?.amount || 0;
                    const percentage = Math.min(100, Math.floor((currentAmount / collection.amount) * 100));
                    menu.button(
                        `${collection.displayName}\n§8Progress: ${percentage}%`,
                        collection.icon
                    );
                });
            }
            menu.button("Back to Menu\n§8Return to main menu");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            if (response.selection === collections.length) {
                await this.showMainMenu(player);
                return;
            }

            if (collections.length > 0) {
                await this.showCollectionDetails(player, collections[response.selection]);
            } else {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCollectionDetails(player, collection) {
        try {
            const progress = await CollectionHandler.getCollectionProgress(player, collection.id);
            const currentAmount = progress?.amount || 0;
            const percentage = Math.min(100, Math.floor((currentAmount / collection.amount) * 100));
            
            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Progress: §f${currentAmount}/${collection.amount} (${percentage}%)\n` +
                    `§7Required: §f${collection.amount} ${collection.itemId.split(":")[1]}\n` +
                    `§7Reward: §f${collection.rewardText}`
                )
                .button("Claim Progress\n§8Check collection status")
                .button("Back\n§8Return to collections")
                .button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    await this.claimCollection(player, collection);
                    break;
                case 1:
                    // Find the group using the collection's parentId
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
        }
    }

    static async claimCollection(player, collection) {
        try {
            const wasUpdated = await CollectionHandler.checkSingleCollection(player, collection);
            const progress = await CollectionHandler.getCollectionProgress(player, collection.id);
            
            if (progress?.completed) {
                // Find group using parentId
                const group = COLLECTION_GROUPS.find(g => g.id === collection.parentId);
                if (group) {
                    await this.showGroupCollections(player, group);
                } else {
                    Logger.log(`Group not found for collection ${collection.id}`, "ERROR", "PLAYER_UI");
                    await this.showMainMenu(player);
                }
            } else {
                const currentAmount = progress?.amount || 0;
                if (wasUpdated) {
                    player.sendMessage(`§aProgress updated! (${currentAmount}/${collection.amount})`);
                } else {
                    player.sendMessage(`§7No new progress. (${currentAmount}/${collection.amount})`);
                }
                await this.showCollectionDetails(player, collection);
            }
        } catch (error) {
            Logger.log(`Error claiming collection: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cError checking collection progress.');
        }
    }

    static async showCompletedCollections(player) {
        try {
            const progress = await CollectionHandler.getPlayerProgress(player);
        const completed = CollectionManager.getCollections()
            .filter(c => progress[c.id]?.completed)
            .sort((a, b) => (progress[b.id].completedAt - progress[a.id].completedAt));

        // Group completed collections by parentId
        const groupedCollections = {};
        COLLECTION_GROUPS.forEach(group => {
            groupedCollections[group.id] = completed
                .filter(c => c.parentId === group.id)
                .sort((a, b) => a.order - b.order);
        });

            let menuText = "§7Your completed collections:\n\n";
            
            if (completed.length === 0) {
                menuText += "§cNo collections completed yet.";
            } else {
                COLLECTION_GROUPS.forEach(group => {
                    const groupCompleted = groupedCollections[group.id];
                    if (groupCompleted.length > 0) {
                        menuText += `${group.displayName}:\n`;
                        groupCompleted.forEach(collection => {
                            const completedAt = new Date(progress[collection.id].completedAt)
                                .toLocaleString();
                            menuText += `§7- ${collection.name} §8(${completedAt})\n`;
                        });
                        menuText += '\n';
                    }
                });
            }

            const menu = new MessageFormData()
                .title("§b§lCompleted Collections")
                .body(menuText)
                .button1("Back")
                .button2("Close");

            const response = await menu.show(player);
            
            if (!response.canceled && response.selection === 0) {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing completed collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }
}
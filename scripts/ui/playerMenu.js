// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { Logger } from '../utils/logger.js';

export class PlayerMenu {
    static async showMainMenu(player) {
        try {
            const menu = new ActionFormData()
                .title("§b§lSkychievments")
                .body("§7Select a category to view:\n")
                .button("Active Collections\n§8View available tasks")
                .button("Completed Collections\n§8View your achievements")
                .button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    await this.showActiveCollections(player);
                    break;
                case 1:
                    await this.showCompletedCollections(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showActiveCollections(player) {
        try {
            // Check progress
            const progress = await CollectionHandler.checkProgress(player);
            const collections = CollectionManager.getEnabledCollections()
                .filter(c => !progress[c.id]?.completed);

            const menu = new ActionFormData()
                .title("§b§lActive Collections")
                .body("§7Select a collection to view details:\n");

            if (collections.length === 0) {
                menu.button("§cNo Active Collections\n§8Complete them all!");
            } else {
                collections.forEach(collection => {
                    const currentAmount = progress[collection.id]?.amount || 0;
                    const percentage = Math.min(100, Math.floor((currentAmount / collection.amount) * 100));
                    menu.button(
                        `${collection.displayName}\n§8Progress: ${percentage}%`
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
                await this.showCollectionDetails(player, collections[response.selection], progress);
            } else {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing active collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCollectionDetails(player, collection, progress) {
        try {
            const currentAmount = progress[collection.id]?.amount || 0;
            const percentage = Math.min(100, Math.floor((currentAmount / collection.amount) * 100));
            
            const menu = new MessageFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Progress: §f${currentAmount}/${collection.amount} (${percentage}%)\n` +
                    `§7Required: §f${collection.amount} ${collection.itemId}\n` +
                    `§7Reward: §f${collection.rewardText}`
                )
                .button1("Back")
                .button2("Close");

            const response = await menu.show(player);
            
            if (!response.canceled && response.selection === 0) {
                await this.showActiveCollections(player);
            }
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCompletedCollections(player) {
        try {
            const progress = await CollectionHandler.checkProgress(player);
            const completed = CollectionManager.getCollections()
                .filter(c => progress[c.id]?.completed)
                .sort((a, b) => (progress[b.id].completedAt - progress[a.id].completedAt));

            const menu = new ActionFormData()
                .title("§b§lCompleted Collections")
                .body("§7Your completed collections:\n");

            if (completed.length === 0) {
                menu.button("§cNo Completed Collections\n§8Complete some tasks first!");
            } else {
                completed.forEach(collection => {
                    const completedAt = new Date(progress[collection.id].completedAt)
                        .toLocaleString();
                    menu.button(
                        `${collection.displayName}\n§8Completed`
                    );
                });
            }
            menu.button("Back to Menu\n§8Return to main menu");

            const response = await menu.show(player);
            
            if (!response.canceled && (response.selection === completed.length || completed.length === 0)) {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing completed collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }
}
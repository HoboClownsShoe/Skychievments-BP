import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections';
import { Logger } from '../utils/logger';
import { world } from '@minecraft/server';
import { CollectionHandler } from '../handlers/collectionHandler.js';

export class PlayerMenu {
    static async showMainMenu(player) {
        try {
            Logger.log(`Opening player menu for ${player.name}`, "DEBUG", "PLAYER_UI");
            
            await CollectionHandler.checkProgress(player);
q
            const menu = new ActionFormData()
                .title("§b§lSkychievments")
                .body("§7View your collection progress\n")
                .button("Active Collections\n§8View current progress")
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
            Logger.log(`Showing active collections for ${player.name}`, "DEBUG", "PLAYER_UI");
            
            const collections = CollectionManager.getEnabledCollections();
            const progress = world.getDynamicProperty(`progress_${player.id}`) || '{}';
            const playerProgress = JSON.parse(progress);
            
            let menuText = "§7Current collection progress:\n\n";
            
            if (collections.length === 0) {
                menuText += "§cNo active collections available.";
            } else {
                collections.forEach(collection => {
                    const currentAmount = playerProgress[collection.id]?.amount || 0;
                    const percentage = Math.min(100, Math.floor((currentAmount / collection.amount) * 100));
                    
                    menuText += `§l${collection.name}\n`;
                    menuText += `§7Progress: §f${percentage}% (${currentAmount}/${collection.amount})\n`;
                    menuText += `§7Reward: §f${collection.rewardText}\n\n`;
                });
            }

            const menu = new MessageFormData()
                .title("§b§lActive Collections")
                .body(menuText)
                .button1("Back")
                .button2("Close");

            const response = await menu.show(player);
            
            if (!response.canceled && response.selection === 0) {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing active collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCompletedCollections(player) {
        try {
            Logger.log(`Showing completed collections for ${player.name}`, "DEBUG", "PLAYER_UI");
            
            const progress = world.getDynamicProperty(`progress_${player.id}`) || '{}';
            const playerProgress = JSON.parse(progress);
            
            let menuText = "§7Your completed collections:\n\n";
            const completed = Object.entries(playerProgress)
                .filter(([_, data]) => data.completed)
                .sort((a, b) => b[1].completedAt - a[1].completedAt);
            
            if (completed.length === 0) {
                menuText += "§cNo collections completed yet.";
            } else {
                completed.forEach(([id, data]) => {
                    const collection = CollectionManager.getCollections().find(c => c.id === id);
                    if (collection) {
                        menuText += `§l${collection.name}\n`;
                        menuText += `§7Completed: §f${new Date(data.completedAt).toLocaleString()}\n\n`;
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
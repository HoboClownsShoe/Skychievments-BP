import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections';
import { Logger } from '../utils/logger';

export class AdminMenu {
    static async showMainMenu(player) {
        try {
            Logger.log(`Opening admin menu for ${player.name}`, "DEBUG", "ADMIN_UI");
            
            const collections = CollectionManager.getCollections();
            
            const menu = new ActionFormData()
                .title("§6§lSkychievments Admin")
                .body("§7Manage collections and view status\n")
                .button("View Collections\n§8Manage collection status")
                .button("Reload Collections\n§8Refresh from config")
                .button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    await this.showCollectionsList(player);
                    break;
                case 1:
                    await this.reloadCollections(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in admin main menu: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showCollectionsList(player) {
        try {
            Logger.log(`Opening collections list for ${player.name}`, "DEBUG", "ADMIN_UI");
            
            const collections = CollectionManager.getCollections();
            
            const menu = new ActionFormData()
                .title("§6§lManage Collections")
                .body("§7Click a collection to toggle its status\n");

            collections.forEach(collection => {
                menu.button(
                    `${collection.name}\n§8${collection.enabled ? '§aEnabled' : '§cDisabled'}`
                );
            });
            menu.button("Back to Main Menu\n§8Return to admin menu");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            if (response.selection === collections.length) {
                await this.showMainMenu(player);
                return;
            }

            const selectedCollection = collections[response.selection];
            await this.toggleCollection(player, selectedCollection);
        } catch (error) {
            Logger.log(`Error in collections list: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async toggleCollection(player, collection) {
        try {
            Logger.log(`Toggling collection ${collection.id}`, "DEBUG", "ADMIN_UI");
            
            const newState = !collection.enabled;
            const form = new MessageFormData()
                .title(`§6§l${collection.name}`)
                .body(
                    `§7Are you sure you want to ${newState ? 'enable' : 'disable'} this collection?\n\n` +
                    `Required: §f${collection.amount} ${collection.itemId}\n` +
                    `Reward: §f${collection.rewardText}`
                )
                .button1("Confirm")
                .button2("Cancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                CollectionManager.toggleCollection(collection.id, newState);
                player.sendMessage(`§aCollection ${collection.name} ${newState ? 'enabled' : 'disabled'}!`);
            }
            
            await this.showCollectionsList(player);
        } catch (error) {
            Logger.log(`Error toggling collection: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async reloadCollections(player) {
        try {
            Logger.log(`Reloading collections`, "DEBUG", "ADMIN_UI");
            
            const success = await CollectionManager.loadCollections();
            player.sendMessage(success ? 
                '§aCollections reloaded successfully!' : 
                '§cFailed to reload collections!'
            );
            
            await this.showMainMenu(player);
        } catch (error) {
            Logger.log(`Error reloading collections: ${error}`, "ERROR", "ADMIN_UI");
        }
    }
}
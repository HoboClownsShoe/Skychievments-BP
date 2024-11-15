// scripts/ui/adminMenu.js
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';
import { AVAILABLE_BLOCKS } from '../config/availableBlocks.js'


export class AdminMenu {
    static async showMainMenu(player) {
        try {
            const menu = new ActionFormData()
                .title("§6§lSkychievments Admin")
                .body("§7Manage collections and settings\n")
                .button("View Collections\n§8Manage collection status")
                .button("Create Collection\n§8Add new collection")
                .button("Reload Collections\n§8Refresh from storage")
                .button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    await this.showCollectionsList(player);
                    break;
                case 1:
                    await this.showCreateCollection(player);
                    break;
                case 2:
                    await this.reloadCollections(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in admin main menu: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showCreateCollection(player) {
        try {
            const form = new ModalFormData()
                .title("Create New Collection")
                //.textField("Collection ID", "unique_identifier")
                .textField("Name", "Collection Name")
                .textField("Description", "Collection description")
                .dropdown("Required Item", AVAILABLE_BLOCKS)
                .slider("Required Amount", 1, 64, 1)
                .toggle("Custom Reward Command", false)
                .textField("Reward Command/Text", "give @p diamond 1")
                .dropdown("Reward Item (if not custom)", AVAILABLE_BLOCKS)
                .slider("Reward Amount", 1, 64, 1);

            const response = await form.show(player);
            
            if (response.canceled) {
                await this.showMainMenu(player);
                return;
            }

            const [ name, description, itemIndex, amount, isCustom, rewardCommand, rewardItemIndex, rewardAmount] = response.formValues;

            // Create collection object
            const collection = {
                //id: id.toLowerCase().replace(/\s+/g, '_'),
                name,
                description,
                icon: AVAILABLE_BLOCKS[itemIndex],
                itemId: AVAILABLE_BLOCKS[itemIndex],
                amount,
                reward: isCustom ? rewardCommand : `give @p ${AVAILABLE_BLOCKS[rewardItemIndex]} 1`,
                rewardText: isCustom ? rewardCommand.split(' ').slice(2).join(' ') : `1 ${AVAILABLE_BLOCKS[rewardItemIndex].split(':')[1]}`,
                rewardAmount,
                enabled: true
            };

            if (await CollectionManager.addCollection(collection)) {
                player.sendMessage('§aCollection created successfully!');
            } else {
                player.sendMessage('§cFailed to create collection!');
            }

            await this.showMainMenu(player);
        } catch (error) {
            Logger.log(`Error creating collection: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showCollectionsList(player) {
        try {
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

            await this.toggleCollection(player, collections[response.selection]);
        } catch (error) {
            Logger.log(`Error in collections list: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async toggleCollection(player, collection) {
        try {
            const newState = !collection.enabled;
            const form = new MessageFormData()
                .title(collection.name)
                .body(
                    `§7Are you sure you want to ${newState ? 'enable' : 'disable'} this collection?\n\n` +
                    `${collection.description}\n\n` +
                    `Required: §f${collection.amount} ${collection.itemId.split(':')[1]}\n` +
                    `Reward: §f${collection.rewardText}`
                )
                .button1("Confirm")
                .button2("Cancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                await CollectionManager.toggleCollection(collection.id, newState);
                player.sendMessage(`§aCollection ${collection.name} ${newState ? 'enabled' : 'disabled'}!`);
            }
            
            await this.showCollectionsList(player);
        } catch (error) {
            Logger.log(`Error toggling collection: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async reloadCollections(player) {
        try {
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
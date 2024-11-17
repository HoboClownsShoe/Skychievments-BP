// scripts/ui/adminMenu.js
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';
import { AVAILABLE_BLOCKS } from '../config/availableBlocks.js'
import { COLLECTION_GROUPS, getGroupIds } from '../config/collectionGroups.js';
import { CollectionHelper } from '../utils/helpers.js';
import { world } from '@minecraft/server';


export class AdminMenu {
    static async showMainMenu(player) {
        try {
            const menu = new ActionFormData()
                .title("Admin")
                .body("§7Manage collections and settings\n")
                .button("View Collections\n§8Manage collection status")
                .button("Create Collection\n§8Add new collection")
                .button("Reload Collections\n§8Refresh from storage")
                .button("Reset System\n§8Clear all data")
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
                case 3:
                    await this.showResetConfirmation(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in admin main menu: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showCreateCollection(player) {
        try {
            // First show group selection
            const groupMenu = new ActionFormData()
                .title("§6§lSelect Collection Group")
                .body("§7Choose which group this collection belongs to:\n");

            COLLECTION_GROUPS.sort((a, b) => a.order - b.order).forEach(group => {
                groupMenu.button(
                    `${group.displayName}\n§8${group.description}`,
                    group.icon
                );
            });

            const groupResponse = await groupMenu.show(player);
            if (groupResponse.canceled) {
                await this.showMainMenu(player);
                return;
            }

            const selectedGroup = COLLECTION_GROUPS[groupResponse.selection];

            // Then show collection creation form
            const form = new ModalFormData()
                .title(`Create New ${selectedGroup.name} Collection`)
                .textField("Name", "Collection Name")
                .textField("Display Name", `${selectedGroup.displayName.split('l')[0]}lCollection Name`)
                .textField("Description", "Collection description")
                .dropdown("Required Item", AVAILABLE_BLOCKS)
                .textField("Required Amount", "64", "Enter a number between 1 and 999999")
                .toggle("Custom Reward Command", false)
                .textField("Reward Command/Text", "give @p diamond 1")
                .dropdown("Reward Item (if not custom)", AVAILABLE_BLOCKS);

            const response = await form.show(player);
            
            if (response.canceled) {
                await this.showMainMenu(player);
                return;
            }

            const [name, displayName, description, itemIndex, amountStr, isCustom, rewardCommand, rewardItemIndex] = response.formValues;

            // Validate amount
            const amount = parseInt(amountStr);
            if (isNaN(amount) || amount < 1 || amount > 999999) {
                player.sendMessage('§cInvalid amount! Must be a number between 1 and 999999.');
                await this.showCreateCollection(player);
                return;
            }

            // Generate ID
            const id = await CollectionHelper.generateId(name);

            // Get current collections in this group for ordering
            const groupCollections = CollectionManager.getCollections()
                .filter(c => c.parentId === selectedGroup.id);
            const order = groupCollections.length;

            // Create collection object
            const collection = {
                id,
                parentId: selectedGroup.id,
                name,
                displayName,
                description,
                icon: AVAILABLE_BLOCKS[itemIndex],
                itemId: AVAILABLE_BLOCKS[itemIndex],
                amount,
                reward: isCustom ? rewardCommand : `give @p ${AVAILABLE_BLOCKS[rewardItemIndex]} 1`,
                rewardText: isCustom ? rewardCommand.split(' ').slice(2).join(' ') : `1 ${AVAILABLE_BLOCKS[rewardItemIndex].split(':')[1]}`,
                enabled: true,
                order
            };

            if (await CollectionManager.addCollection(collection)) {
                player.sendMessage(`§aCollection created successfully!\n§7Group: ${selectedGroup.name}\n§7ID: ${id}`);
            } else {
                player.sendMessage('§cFailed to create collection!');
            }

            await this.showMainMenu(player);
        } catch (error) {
            Logger.log(`Error creating collection: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred while creating the collection.');
        }
    }

    static async showResetConfirmation(player) {
        try {
            const form = new MessageFormData()
                .title("§c§lReset System")
                .body(
                    "§cWARNING: This will clear ALL data including:\n\n" +
                    "§7- All collections\n" +
                    "§7- All player progress\n" +
                    "§7- All counters and settings\n\n" +
                    "§cThis action cannot be undone!\n" +
                    "§cAre you sure you want to continue?"
                )
                .button1("§cReset Everything")
                .button2("Cancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                await this.resetSystem(player);
            } else {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing reset confirmation: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async resetSystem(player) {
        try {
            Logger.log("Starting system reset", "INFO", "ADMIN_UI");

            // Get all dynamic properties
            const properties = [];
            for (const prop of world.getDynamicPropertyIds()) {
                if (prop.startsWith('sk_') || prop.startsWith('progress_')) {
                    properties.push(prop);
                }
            }

            // Clear each property
            for (const prop of properties) {
                world.setDynamicProperty(prop, undefined);
                Logger.log(`Cleared property: ${prop}`, "DEBUG", "ADMIN_UI");
            }

            // Reset collection ID counter
            await CollectionHelper.resetIdCounter();

            // Reload collections from defaults
            await CollectionManager.loadCollections();

            player.sendMessage('§aSystem reset successful! All data has been cleared.');
            Logger.log("System reset completed", "INFO", "ADMIN_UI");

            await this.showMainMenu(player);
        } catch (error) {
            Logger.log(`Error during system reset: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred during system reset.');
            await this.showMainMenu(player);
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
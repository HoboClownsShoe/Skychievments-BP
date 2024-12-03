// scripts/ui/adminMenu.js
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';
import { COLLECTION_GROUPS, getGroupIds } from '../config/collectionGroups.js';
import { CREATIVE_CATEGORIES } from '../config/categorizedItems.js'
import { CollectionHelper } from '../utils/helpers.js';
import { world } from '@minecraft/server';

export class AdminMenu {
    static async showMainMenu(player) {
        try {
            Logger.log(`Opening admin main menu for ${player.name}`, "INFO", "ADMIN_UI");
            
            const debugStatus = Logger.isDebugEnabled() ? '§aEnabled' : '§cDisabled';
            
            const menu = new ActionFormData()
                .title("Admin")
                .body(`§7Manage collections and settings\n\n§7Debug Logging: ${debugStatus}\n`)
                .button("View Collections")
                .button("Create Collection")
                .button("Toggle Debug Logging")
                .button("Reload Collections")
                .button("Reset System")
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
                    const debugEnabled = Logger.toggleDebug();
                    player.sendMessage(`§7Debug logging ${debugEnabled ? '§aenabled' : '§cdisabled'}`);
                    await this.showMainMenu(player);
                    break;
                case 3:
                    await this.reloadCollections(player);
                    break;
                case 4:
                    await this.showResetConfirmation(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in admin main menu: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showCreateCollection(player) {
        try {
            Logger.log(`Starting collection creation process for ${player.name}`, "INFO", "ADMIN_UI");
            
            // Group selection
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
                Logger.log("Collection creation cancelled at group selection", "INFO", "ADMIN_UI");
                await this.showMainMenu(player);
                return;
            }

            const selectedGroup = COLLECTION_GROUPS[groupResponse.selection];

            // Collection details
            const detailsForm = new ModalFormData()
                .title(`Create Collection Details`)
                .textField("Display Name", "§8Collection Name", "")
                .textField("Description", "Collection description", "");

            const detailsResponse = await detailsForm.show(player);
            if (detailsResponse.canceled) return;

            const [displayName, description] = detailsResponse.formValues;
            
            if (!displayName || !description) {
                player.sendMessage('§cDisplay name and description are required!');
                return;
            }

            // Collect requirements
            const requirements = await this.collectRequirements(player);
            if (requirements === null) {
                Logger.log("Collection creation cancelled during requirements", "INFO", "ADMIN_UI");
                await this.showMainMenu(player);
                return;
            }

            if (requirements.length === 0) {
                player.sendMessage('§cAt least one requirement is needed!');
                Logger.log("Collection creation cancelled - no requirements added", "INFO", "ADMIN_UI");
                await this.showMainMenu(player);
                return;
            }

            // Collect rewards
            const rewards = await this.collectRewards(player);
            if (!rewards || rewards.length === 0) {
                player.sendMessage('§cAt least one reward is needed!');
                return;
            }

            // Generate collection ID from first requirement
            const baseId = requirements[0].itemId.split(':')[1];
            const id = await CollectionHelper.generateId(baseId);

            // Create collection
            const collection = {
                id,
                parentId: selectedGroup.id,
                displayName,
                description,
                icon: selectedGroup.icon,
                requirements,
                rewards,
                enabled: true,
                order: CollectionManager.getCollections()
                    .filter(c => c.parentId === selectedGroup.id)
                    .length
            };

            if (await CollectionManager.addCollection(collection)) {
                player.sendMessage(`§a§lCollection Created!\n§r§7Group: ${selectedGroup.name}\n§7ID: ${collection.id}`);
                Logger.log(`Collection created successfully: ${collection.id}`, "INFO", "ADMIN_UI");
            } else {
                player.sendMessage('§c§lFailed to create collection!');
                Logger.log(`Failed to create collection with data: ${JSON.stringify(collection)}`, "ERROR", "ADMIN_UI");
            }

            await this.showMainMenu(player);

        } catch (error) {
            Logger.log(`Error creating collection: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred while creating the collection.');
        }
    }

    static async showResetConfirmation(player) {
        try {
            Logger.log(`Showing reset confirmation to ${player.name}`, "DEBUG", "ADMIN_UI");
            
            const form = new MessageFormData()
                .title("§c§lReset System")
                .body(
                    "§cWARNING: This will clear ALL data including:\n\n" +
                    "§7- All collections\n" +
                    "§7- All rewards\n" +
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

            // Reload collections and rewards from defaults
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
            Logger.log(`Showing collections list to ${player.name}`, "INFO", "ADMIN_UI");
            
            const collections = CollectionManager.getCollections();
            
            const menu = new ActionFormData()
                .title("§6§lManage Collections")
                .body("§7Click a collection to view details\n");

            collections.forEach(collection => {
                const reqText = collection.requirements
                    .map(r => `${r.amount}x ${r.itemId.split(':')[1]}`)
                    .join(', ');
                
                menu.button(
                    `${collection.displayName}\n§8${collection.enabled ? '§aEnabled' : '§cDisabled'} - ${reqText}`
                );
            });
            
            menu.button("Back to Main Menu\n§8Return to admin menu");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            if (response.selection === collections.length) {
                await this.showMainMenu(player);
                return;
            }

            await this.showCollectionDetails(player, collections[response.selection]);
        } catch (error) {
            Logger.log(`Error in collections list: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async reloadCollections(player) {
        try {
            Logger.log("Starting collections reload", "INFO", "ADMIN_UI");
            
            // Get confirmation from user
            const confirmForm = new MessageFormData()
                .title("§6§lReload Collections")
                .body(
                    "§7This will:\n" +
                    "§7- Clear current collections\n" +
                    "§7- Reset to default collections\n" +
                    "§7- Keep player progress\n\n" +
                    "§cAre you sure you want to continue?"
                )
                .button1("§aConfirm Reload")
                .button2("§cCancel");
    
            const response = await confirmForm.show(player);
            
            if (!response.canceled && response.selection === 0) {
                // Clear collection storage
                world.setDynamicProperty('sk_collections', undefined);
                
                Logger.log("Cleared collection storage", "INFO", "ADMIN_UI");
                
                // Reload from defaults
                const collectionsSuccess = await CollectionManager.loadCollections();
                
                if (collectionsSuccess) {
                    player.sendMessage('§aCollections reloaded successfully!');
                    Logger.log("Reload completed successfully", "INFO", "ADMIN_UI");
                } else {
                    player.sendMessage('§cFailed to reload collections!');
                    Logger.log("Reload failed", "ERROR", "ADMIN_UI");
                }
            } else {
                player.sendMessage('§7Reload cancelled');
                Logger.log("Reload cancelled by user", "INFO", "ADMIN_UI");
            }
            
            await this.showMainMenu(player);
        } catch (error) {
            Logger.log(`Error reloading collections: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred while reloading collections');
            await this.showMainMenu(player);
        }
    }

    static async showCreativeSelector(player, title = "Select Item") {
        try {
            while (true) {
                Logger.log(`Opening creative selector: ${title}`, "DEBUG", "ADMIN_UI");
                
                // Start with category selection
                const categoryForm = new ActionFormData()
                    .title(title)
                    .body("§7Choose a category of items:\n");

                Object.entries(CREATIVE_CATEGORIES).forEach(([_, category]) => {
                    categoryForm.button(
                        `${category.name}\n§8${category.description}`,
                        category.icon
                    );
                });
                categoryForm.button("Cancel\n§8Return to previous menu");

                const categoryResponse = await categoryForm.show(player);
                if (categoryResponse.canceled || categoryResponse.selection === Object.keys(CREATIVE_CATEGORIES).length) {
                    Logger.log("Creative selector cancelled at category selection", "DEBUG", "ADMIN_UI");
                    return null;
                }

                // Get selected category
                const currentCategory = Object.keys(CREATIVE_CATEGORIES)[categoryResponse.selection];
                const category = CREATIVE_CATEGORIES[currentCategory];
                Logger.log(`Category selected: ${category.name}`, "DEBUG", "ADMIN_UI");

                // Show all items for selected category
                const form = new ActionFormData()
                    .title(`${category.name}`)
                    .body(`§8Select an item or change category\n`);

                // Add category switcher button
                form.button(
                    "Change Category\n§8Choose different category",
                    "textures/ui/sidebar_buttons.png"
                );

                // Add all items
                category.items.forEach(item => {
                    form.button(
                        `${item.name}\n§8${item.id}`,
                        item.texture
                    );
                });

                form.button("Cancel\n§8Return to category selection");

                const response = await form.show(player);
                if (response.canceled) {
                    Logger.log("Creative selector cancelled at item selection", "DEBUG", "ADMIN_UI");
                    return null;
                }

                // Handle category switcher
                if (response.selection === 0) {
                    Logger.log("Returning to category selection", "DEBUG", "ADMIN_UI");
                    continue;
                }

                // Handle cancel button
                if (response.selection === category.items.length + 1) {
                    Logger.log("Returning to category selection via cancel", "DEBUG", "ADMIN_UI");
                    continue;
                }

                // Handle item selection
                if (response.selection <= category.items.length) {
                    const selectedItem = category.items[response.selection - 1];
                    Logger.log(`Item selected: ${selectedItem.id}`, "DEBUG", "ADMIN_UI");
                    return selectedItem.id;
                }
            }
        } catch (error) {
            Logger.log(`Error in creative selector: ${error}`, "ERROR", "ADMIN_UI");
            return null;
        }
    }

    static async showCollectionDetails(player, collection) {
        try {
            // Format requirements text
            const requirementsText = collection.requirements
                .map(r => `§7- ${r.amount}x ${r.itemId.split(':')[1].replace(/_/g, ' ')}`)
                .join('\n');

            // Format rewards text
            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new MessageFormData()
                .title(collection.displayName)
                .body(
                    `§7Description: §f${collection.description}\n\n` +
                    `§7Status: ${collection.enabled ? '§aEnabled' : '§cDisabled'}\n\n` +
                    `§7Requirements:\n${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}\n\n` +
                    `§7Group: §f${collection.parentId}\n` +
                    `§7ID: §f${collection.id}\n\n` +
                    `§7Would you like to ${collection.enabled ? 'disable' : 'enable'} this collection?`
                )
                .button1(`${collection.enabled ? '§cDisable' : '§aEnable'} Collection`)
                .button2("Back");

            const response = await menu.show(player);
            
            if (!response.canceled && response.selection === 0) {
                await CollectionManager.toggleCollection(collection.id, !collection.enabled);
                player.sendMessage(`§aCollection ${collection.displayName} ${collection.enabled ? 'disabled' : 'enabled'}!`);
            }
            
            await this.showCollectionsList(player);
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async collectRequirements(player) {
        try {
            const requirements = [];
            let collecting = true;
    
            while (collecting) {
                const menu = new ActionFormData()
                    .title("Collection Requirements")
                    .body(
                        `§7Current Requirements: ${requirements.length}\n\n` +
                        (requirements.length > 0 ? 
                            requirements.map(r => 
                                `§7- ${r.amount}x ${r.itemId.split(':')[1]}`
                            ).join('\n') 
                            : '§8No requirements added yet') +
                        '\n\n§8Add requirements or choose an option below'
                    )
                    .button("Add Requirement\n§8Add new item requirement")
                    .button("Finish\n§8Complete requirements")
                    .button("Cancel\n§8Return to menu");
    
                const response = await menu.show(player);
                
                if (response.canceled || response.selection === 2) {
                    Logger.log("Requirements collection cancelled", "INFO", "ADMIN_UI");
                    return null;
                }
                
                if (response.selection === 1) {
                    if (requirements.length === 0) {
                        player.sendMessage('§cAt least one requirement is needed!');
                        continue;
                    }
                    collecting = false;
                    continue;
                }
    
                const selectedItem = await this.showCreativeSelector(player, "Choose Required Item");
                if (selectedItem) {
                    const amountForm = new ModalFormData()
                        .title("Set Required Amount")
                        .textField("Amount Required", "64", "64");
    
                    const amountResponse = await amountForm.show(player);
                    if (!amountResponse.canceled) {
                        const amount = parseInt(amountResponse.formValues[0]);
                        if (isNaN(amount) || amount < 1) {
                            player.sendMessage('§cInvalid amount! Must be a positive number.');
                            continue;
                        }
    
                        requirements.push({
                            itemId: selectedItem,
                            amount: amount
                        });
                    }
                }
            }
    
            return requirements;
        } catch (error) {
            Logger.log(`Error collecting requirements: ${error}`, "ERROR", "ADMIN_UI");
            return null;
        }
    }

    static async collectRewards(player) {
        try {
            const rewards = [];
            let collecting = true;

            while (collecting) {
                const menu = new ActionFormData()
                    .title("Collection Rewards")
                    .body(
                        `§7Current Rewards: ${rewards.length}\n\n` +
                        (rewards.length > 0 ? 
                            rewards.map(r => `§7- ${r.displayText}`).join('\n') 
                            : '§8No rewards added yet') +
                        '\n\n§8Add rewards or finish'
                    )
                    .button("Add Item Reward\n§8Give items to player")
                    .button("Add Command Reward\n§8Use custom command")
                    .button("Finish\n§8Complete rewards");

                const response = await menu.show(player);
                
                if (response.canceled || response.selection === 2) {
                    if (rewards.length === 0) {
                        player.sendMessage('§cAt least one reward is needed!');
                        continue;
                    }
                    collecting = false;
                    continue;
                }

                if (response.selection === 0) {
                    // Item reward
                    const selectedItem = await this.showCreativeSelector(player, "Choose Reward Item");
                    if (selectedItem) {
                        const amountForm = new ModalFormData()
                            .title("Set Reward Amount")
                            .textField("Amount", "1", "1");

                        const amountResponse = await amountForm.show(player);
                        if (!amountResponse.canceled) {
                            const amount = parseInt(amountResponse.formValues[0]);
                            if (isNaN(amount) || amount < 1) {
                                player.sendMessage('§cInvalid amount! Must be a positive number.');
                                continue;
                            }

                            rewards.push({
                                type: "item",
                                itemId: selectedItem,
                                amount: amount,
                                displayText: `${amount}x ${selectedItem.split(':')[1].replace(/_/g, ' ')}`
                            });
                        }
                    }
                } else {
                    // Command reward
                    const commandForm = new ModalFormData()
                        .title("Set Command Reward")
                        .textField("Command", "effect @p haste 300 1")
                        .textField("Display Text", "Haste Effect (5 minutes)");

                    const commandResponse = await commandForm.show(player);
                    if (!commandResponse.canceled) {
                        const [command, displayText] = commandResponse.formValues;
                        if (!command || !displayText) {
                            player.sendMessage('§cCommand and display text are required!');
                            continue;
                        }

                        rewards.push({
                            type: "command",
                            command: command,
                            displayText: displayText
                        });
                    }
                }
            }

            return rewards;
        } catch (error) {
            Logger.log(`Error collecting rewards: ${error}`, "ERROR", "ADMIN_UI");
            return [];
        }
    }
}
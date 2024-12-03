// scripts/ui/adminMenu.js
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';
import { COLLECTION_GROUPS, CollectionGroupManager } from '../config/collectionGroups.js';
import { CREATIVE_CATEGORIES } from '../config/categorizedItems.js'
import { CollectionHelper } from '../utils/helpers.js';
import { world } from '@minecraft/server';

export class AdminMenu {
    static async showMainMenu(player) {
        try {
            // Get overall statistics for display
            const collections = CollectionManager.getCollections();
            const enabledCount = collections.filter(c => c.enabled).length;
            const debugStatus = Logger.isDebugEnabled() ? '§aEnabled' : '§cDisabled';
            
            const menu = new ActionFormData()
                .title("Admin")
                .body(
                    `§7Manage collections and settings\n\n` +
                    `§7Total Collections: §f${enabledCount}/${collections.length} enabled\n` +
                    `§7Debug Logging: ${debugStatus}\n`
                )
                .button("View Collections\n§8Manage existing collections")
                .button("Create Collection\n§8Add new collection")
                .button("Storage Stats\n§8Check storage usage")
                .button("System Management\n§8Reset and reload options")
                .button("Toggle Debug\n§8Debug logging")
                .button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    await this.showGroupSelection(player, "View Collections");
                    break;
                case 1:
                    await this.showCreateCollection(player);
                    break;
                case 2:
                    await this.showStorageStats(player);
                    break;
                case 3:
                    await this.showSystemManagement(player);
                    break;
                case 4:
                    const debugEnabled = Logger.toggleDebug();
                    player.sendMessage(`§7Debug logging ${debugEnabled ? '§aenabled' : '§cdisabled'}`);
                    await this.showMainMenu(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in admin main menu: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showSystemManagement(player) {
        try {
            const menu = new ActionFormData()
                .title("§6§lSystem Management")
                .body(
                    "§7Choose a system management option:\n\n" +
                    "§cFull Reset (Development Only):\n" +
                    "§7- Clears all collections and progress\n" +
                    "§7- Reloads hardcoded defaults\n" +
                    "§7- Resets entire system state\n\n" +
                    "§6Load New Collections:\n" +
                    "§7- Adds any new hardcoded collections\n" +
                    "§7- Preserves existing collections\n" +
                    "§7- Keeps player progress\n\n" +
                    "§eWarning: Choose these options carefully!"
                )
                .button("§cFull Reset\n§8Development only")
                .button("§6Load New Collections\n§8Add new defaults")
                .button("Back\n§8Return to menu");

            const response = await menu.show(player);
            
            if (response.canceled) {
                await this.showMainMenu(player);
                return;
            }

            switch (response.selection) {
                case 0:
                    await this.showFullResetConfirmation(player);
                    break;
                case 1:
                    await this.showLoadNewConfirmation(player);
                    break;
                default:
                    await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error in system management menu: ${error}`, "ERROR", "ADMIN_UI");
            await this.showMainMenu(player);
        }
    }
    
    static async showCreateCollection(player) {
        try {
            Logger.log(`Starting collection creation process for ${player.name}`, "INFO", "ADMIN_UI");
            
            // Group selection code remains the same until we get the selectedGroup
            const groupMenu = new ActionFormData()
                .title("§6§lSelect Collection Group")
                .body("§7Choose which group this collection belongs to:\n");
    
            const orderedGroups = CollectionGroupManager.getGroupIds()
                .map(id => CollectionGroupManager.getGroupById(id))
                .sort((a, b) => a.order - b.order);
    
            orderedGroups.forEach(group => {
                const groupCollections = CollectionManager.getCollectionsByGroup(group.id);
                
                groupMenu.button(
                    `${group.displayName}\n` +
                    `§8${groupCollections.length} collections - ${group.description}`,
                    group.icon
                );
            });
    
            const groupResponse = await groupMenu.show(player);
            if (groupResponse.canceled) {
                Logger.log("Collection creation cancelled at group selection", "INFO", "ADMIN_UI");
                await this.showMainMenu(player);
                return;
            }
    
            const selectedGroup = orderedGroups[groupResponse.selection];
            Logger.log(`Selected group: ${selectedGroup.id}`, "DEBUG", "ADMIN_UI");
    
            // Collection details form
            const detailsForm = new ModalFormData()
                .title("Create Collection Details")
                .textField(
                    "§2Display Name§r\n§7The name shown to players",
                    "§8Example: §2§lStone Age Begins"
                )
                .textField(
                    "§2Description§r\n§7Explain what players need to do",
                    "§8Example: Begin your journey by gathering basic materials!"
                );
    
            const detailsResponse = await detailsForm.show(player);
            if (detailsResponse.canceled) {
                await this.showMainMenu(player);
                return;
            }
    
            const [displayName, description] = detailsResponse.formValues;
            
            if (!displayName || !description) {
                player.sendMessage('§cDisplay name and description are required!');
                await this.showMainMenu(player);
                return;
            }
    
            // Collect requirements
            const requirements = await this.collectRequirements(player);
            if (requirements === null || requirements.length === 0) {
                player.sendMessage('§cAt least one requirement is needed!');
                Logger.log("Collection creation cancelled - no requirements added", "INFO", "ADMIN_UI");
                await this.showMainMenu(player);
                return;
            }
    
            // Collect rewards
            const rewards = await this.collectRewards(player);
            if (!rewards || rewards.length === 0) {
                player.sendMessage('§cAt least one reward is needed!');
                await this.showMainMenu(player);
                return;
            }
    
            // Generate collection ID - now including the group ID
            const baseId = requirements[0].itemId.split(':')[1];
            const id = await CollectionHelper.generateId(baseId, selectedGroup.id);
            
            if (!id) {
                player.sendMessage('§cFailed to generate collection ID!');
                Logger.log("Failed to generate collection ID", "ERROR", "ADMIN_UI");
                await this.showMainMenu(player);
                return;
            }
    
            // Create and validate the collection object
            const collection = {
                id,
                parentId: selectedGroup.id,
                displayName,
                description,
                icon: selectedGroup.icon,
                requirements,
                rewards,
                enabled: true,
                order: CollectionManager.getCollectionsByGroup(selectedGroup.id).length
            };
    
            // Log the collection data before adding
            Logger.log(`Attempting to add collection: ${JSON.stringify(collection)}`, "DEBUG", "ADMIN_UI");
    
            // Add the collection with proper error handling
            try {
                const added = await CollectionManager.addCollection(collection);
                if (added) {
                    player.sendMessage(
                        `§a§lCollection Created!\n` +
                        `§r§7Group: ${selectedGroup.name}\n` +
                        `§7ID: ${collection.id}`
                    );
                    Logger.log(`Collection created successfully: ${collection.id}`, "INFO", "ADMIN_UI");
                } else {
                    throw new Error("Collection manager returned false");
                }
            } catch (addError) {
                player.sendMessage('§c§lFailed to create collection!');
                Logger.log(`Failed to create collection: ${addError}`, "ERROR", "ADMIN_UI");
            }
    
            await this.showMainMenu(player);
    
        } catch (error) {
            Logger.log(`Error creating collection: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred while creating the collection.');
            await this.showMainMenu(player);
        }
    }

    static async showCollectionsList(player) {
        try {
            Logger.log(`Showing collections list to ${player.name}`, "DEBUG", "ADMIN_UI");
            
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
            Logger.log("Starting collections reload", "DEBUG", "ADMIN_UI");
            
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
                
                Logger.log("Cleared collection storage", "DEBUG", "ADMIN_UI");
                
                // Reload from defaults
                const collectionsSuccess = await CollectionManager.loadCollections();
                
                if (collectionsSuccess) {
                    player.sendMessage('§aCollections reloaded successfully!');
                    Logger.log("Reload completed successfully", "DEBUG", "ADMIN_UI");
                } else {
                    player.sendMessage('§cFailed to reload collections!');
                    Logger.log("Reload failed", "ERROR", "ADMIN_UI");
                }
            } else {
                player.sendMessage('§7Reload cancelled');
                Logger.log("Reload cancelled by user", "DEBUG", "ADMIN_UI");
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
                    Logger.log("Requirements collection cancelled", "DEBUG", "ADMIN_UI");
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

    static async showStorageStats(player) {
        try {
            Logger.log(`Showing storage stats to ${player.name}`, "DEBUG", "ADMIN_UI");
            
            // Get all stats first
            const stats = await CollectionManager.getStorageStats();
            if (!stats) {
                player.sendMessage('§cFailed to get storage statistics');
                return;
            }
    
            // Create menu for group selection
            const menu = new ActionFormData()
                .title("§2§lStorage Statistics")
                .body(CollectionManager.formatStorageStats(stats))
                .button("Back to Menu\n§8Return to admin menu");
    
            const response = await menu.show(player);
            
            if (!response.canceled) {
                await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing storage stats: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred while showing storage statistics');
        }
    }

    static async showGroupSelection(player, action) {
        try {
            const menu = new ActionFormData()
                .title(`§6§l${action}`)
                .body("§7Select a collection group:");

            // Get groups in proper order
            const orderedGroups = CollectionGroupManager.getGroupIds()
                .map(id => CollectionGroupManager.getGroupById(id));

            // Add group buttons with statistics
            for (const group of orderedGroups) {
                const collections = CollectionManager.getCollectionsByGroup(group.id);
                const enabled = collections.filter(c => c.enabled).length;
                const stats = await CollectionManager.getStorageStats(group.id);
                const spaceUsed = stats?.[group.id]?.spaceUsedPercent || 0;

                menu.button(
                    `${group.displayName}\n` +
                    `§8${enabled}/${collections.length} enabled - ${spaceUsed}% space used`,
                    group.icon
                );
            }

            menu.button("Back to Menu\n§8Return to admin menu");

            const response = await menu.show(player);
            
            if (response.canceled || response.selection === orderedGroups.length) {
                await this.showMainMenu(player);
                return;
            }

            const selectedGroup = orderedGroups[response.selection];
            
            if (action === "View Collections") {
                await this.showGroupCollections(player, selectedGroup);
            } else {
                // Handle other group-based actions here
                await this.showMainMenu(player);
            }

        } catch (error) {
            Logger.log(`Error in group selection: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showGroupCollections(player, group) {
        try {
            const collections = CollectionManager.getCollectionsByGroup(group.id);
            const stats = await CollectionManager.getStorageStats(group.id);
            
            const menu = new ActionFormData()
                .title(group.displayName)
                .body(
                    `§7Manage collections in ${group.displayName}\n\n` +
                    `§7Total Collections: §f${collections.length}\n` +
                    `§7Space Used: §f${stats[group.id].spaceUsedPercent}%\n\n` +
                    `§8Click a collection to view details`
                );

            // Sort collections by order
            collections.sort((a, b) => a.order - b.order);

            // Add collection buttons
            collections.forEach(collection => {
                const reqText = collection.requirements
                    .map(r => `${r.amount}x ${r.itemId.split(':')[1]}`)
                    .join(', ');
                
                menu.button(
                    `${collection.displayName}\n` +
                    `§8${collection.enabled ? '§aEnabled' : '§cDisabled'} - ${reqText}`
                );
            });
            
            menu.button("Back to Groups\n§8Return to group selection");

            const response = await menu.show(player);
            
            if (response.canceled || response.selection === collections.length) {
                await this.showGroupSelection(player, "View Collections");
                return;
            }

            await this.showCollectionDetails(player, collections[response.selection]);

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    static async showFullResetConfirmation(player) {
        try {
            const form = new MessageFormData()
                .title("§c§lFull System Reset")
                .body(
                    "§cWARNING: This will:\n\n" +
                    "§7- Delete ALL collections\n" +
                    "§7- Clear ALL player progress\n" +
                    "§7- Reset to hardcoded defaults\n\n" +
                    "§c§lThis is for development only!\n" +
                    "§c§lThis cannot be undone!\n" +
                    "§cAre you absolutely sure?"
                )
                .button1("§c§lReset Everything")
                .button2("§aCancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                Logger.log("Starting full system reset", "INFO", "ADMIN_UI");

                // Clear all player progress
                const progressProperties = world.getDynamicPropertyIds()
                    .filter(prop => prop.startsWith('progress_'));
                
                for (const prop of progressProperties) {
                    world.setDynamicProperty(prop, undefined);
                    Logger.log(`Cleared progress: ${prop}`, "DEBUG", "ADMIN_UI");
                }

                // Reset collections to defaults
                const success = await CollectionManager.resetToDefaults();

                if (success) {
                    player.sendMessage('§a§lSystem reset complete!\n§r§7All data has been reset to defaults.');
                    Logger.log("System reset completed successfully", "INFO", "ADMIN_UI");
                } else {
                    player.sendMessage('§c§lError during reset!\n§r§7Check logs for details.');
                    Logger.log("System reset failed", "ERROR", "ADMIN_UI");
                }
            }

            await this.showSystemManagement(player);
        } catch (error) {
            Logger.log(`Error during full reset: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cAn error occurred during system reset.');
            await this.showSystemManagement(player);
        }
    }

    static async showLoadNewConfirmation(player) {
        try {
            const form = new MessageFormData()
                .title("§6§lLoad New Collections")
                .body(
                    "This will:\n" +
                    "§7- Check for new hardcoded collections\n" +
                    "§7- Add any new collections found\n" +
                    "§7- Preserve existing collections and progress\n\n" +
                    "Would you like to continue?"
                )
                .button1("§aLoad New Collections")
                .button2("Cancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                Logger.log("Starting load of new collections", "INFO", "ADMIN_UI");

                const addedCount = await CollectionManager.loadNewDefaultCollections();
                
                if (addedCount > 0) {
                    player.sendMessage(`§a§lSuccess!\n§r§7Added ${addedCount} new collections from defaults.`);
                    Logger.log(`Added ${addedCount} new collections`, "INFO", "ADMIN_UI");
                } else {
                    player.sendMessage("§6No new collections found to add.");
                    Logger.log("No new collections found", "INFO", "ADMIN_UI");
                }
            }

            await this.showSystemManagement(player);
        } catch (error) {
            Logger.log(`Error loading new collections: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§cError loading new collections.');
            await this.showSystemManagement(player);
        }
    }

}

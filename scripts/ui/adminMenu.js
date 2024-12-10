// scripts/ui/adminMenu.js
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';
import { COLLECTION_GROUPS, CollectionGroupManager } from '../config/collectionGroups.js';
import { CREATIVE_CATEGORIES } from '../config/categorizedItems.js'
import { CollectionHelper } from '../utils/helpers.js';
import { world } from '@minecraft/server';
import { SystemManager } from '../utils/systemManager.js';
import { ChestFormData } from '../extensions/forms.js';
import { loadTestCollections } from '../config/testData.js'


export class AdminMenu {
    /**
     * Displays the Main Admin menu to player
     * @param {*} player 
     * @returns 
     */
    static async showMainMenu(player) {
        try {
            const collections = CollectionManager.getCollections();
            const enabledCount = collections.filter(c => c.enabled).length;
            const debugStatus = Logger.isDebugEnabled() ? '§qEnabled' : '§cDisabled';
        
            const menu = new ActionFormData()
                .title("Admin")
                .body(
                    `§7Manage collections and settings\n\n` +                    
                    `§7Debug Logging: ${debugStatus}\n`
                )
                .button("Manage Groups & Collections\n§8View and configure all content")
                .button("Create Collection\n§8Add new collection")
                .button("Storage Stats\n§8Check storage usage")
                .button("System Management\n§8Reset and reload options")
                .button("Toggle Debug\n§8Debug logging")
                .button("Close");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            switch (response.selection) {
                case 0:
                    await this.showGroupsOverview(player);
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
                    player.sendMessage(`§7Debug logging ${debugEnabled ? '§qenabled' : '§cdisabled'}`);
                    await this.showMainMenu(player);
                    break;
            }
        } catch (error) {
            Logger.log(`Error in admin main menu: ${error}`, "ERROR", "ADMIN_UI");
        }
    }

    /**
     * Menu Option 1 Groups Overview 
     */
    /**
     * Main page for group management, diaplays all groups
     * @param {*} player 
     * @returns 
     */
    static async showGroupsOverview(player) {
        try {
            // Get all groups and their states
            const groups = COLLECTION_GROUPS.sort((a, b) => a.order - b.order);
            const menu = new ActionFormData()
                .title("§6§lGroups & Collections")
                .body("§7Click a group to view its collections\n§8Toggle switches control group visibility\n");

            // Add buttons for each group with their current state
            for (const group of groups) {
                const isEnabled = await CollectionGroupManager.isGroupEnabled(group.id);
                const collections = CollectionManager.getCollectionsByGroup(group.id);
                const enabledCollections = collections.filter(c => c.enabled).length;
                
                menu.button(
                    `${isEnabled ? '§q' : '§c'}${group.displayName}\n` +
                    `§8${enabledCollections}/${collections.length} Active`,
                    group.icon
                );
            }

            menu.button("Back to Menu\n§8Return to admin menu");

            const response = await menu.show(player);
            
            if (response.canceled || response.selection === groups.length) {
                await this.showMainMenu(player);
                return;
            }

            // Show collections for selected group
            const selectedGroup = groups[response.selection];
            await this.showGroupCollections(player, selectedGroup);

        } catch (error) {
            Logger.log(`Error in groups overview: ${error}`, "ERROR", "ADMIN_UI");
            await this.showMainMenu(player);
        }
    }

    /**
     * Displays all collections in a given group
     * @param {*} player 
     * @param {*} group 
     * @returns 
     */
    static async showGroupCollections(player, group) {
        try {
            // Get group state and collections
            const isGroupEnabled = await CollectionGroupManager.isGroupEnabled(group.id);
            const collections = CollectionManager.getCollectionsByGroup(group.id)
                .sort((a, b) => a.order - b.order);

            const menu = new ActionFormData()
                .title(group.displayName)
                .body(
                    `§7${group.description}\n\n` +
                    `§7Group Status: ${isGroupEnabled ? '§qEnabled' : '§cDisabled'}\n` +
                    `§7Collections: ${collections.filter(c => c.enabled).length}/${collections.length} enabled\n\n` +
                    `§8Click collection to view details or use toggle to enable/disable\n`
                );

            // Add toggle for group state
            menu.button(
                `${isGroupEnabled ? '§cDisable' : '§qEnable'} Group\n` +
                `§8Toggle visibility for all collections`
            );

            // Add buttons for each collection
            collections.forEach(collection => {
                menu.button(
                    `${collection.enabled ? '§q' : '§c'}${collection.displayName}\n` +
                    `§8${collection.requirements.map(r => 
                        `${r.amount}x ${r.itemId.split(':')[1]}`
                    ).join(', ')}`,
                    collection.icon || "textures/items/paper"
                );
            });

            menu.button("Back to Groups\n§8Return to group list");

            const response = await menu.show(player);
            
            if (response.canceled) {
                await this.showGroupsOverview(player);
                return;
            }

            if (response.selection === 0) {
                // Toggle group state
                await CollectionGroupManager.setGroupState(group.id, !isGroupEnabled);
                player.sendMessage(
                    `§q${group.displayName} ${!isGroupEnabled ? '§qenabled' : '§cdisabled'}!`
                );
                await this.showGroupCollections(player, group);
                return;
            }

            if (response.selection === collections.length + 1) {
                await this.showGroupsOverview(player);
                return;
            }

            // Show collection details
            const selectedCollection = collections[response.selection - 1];
            await this.showCollectionDetails(player, selectedCollection, group);

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "ADMIN_UI");
            await this.showGroupsOverview(player);
        }
    }

    /**
     * Displays a given collections details 
     * @param {*} player 
     * @param {*} collection 
     * @param {*} group 
     * @returns 
     */
    static async showCollectionDetails(player, collection, group) {
        try {
            // Format requirements text
            const requirementsText = collection.requirements
                .map(r => `§7- ${r.amount}x ${r.itemId.split(':')[1].replace(/_/g, ' ')}`)
                .join('\n');

            // Format rewards text
            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `§7Description: §f${collection.description}\n\n` +
                    `§7Status: ${collection.enabled ? '§qEnabled' : '§cDisabled'}\n\n` +
                    `§7Requirements:\n${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}\n\n` +
                    `§7Group: §f${collection.parentId}\n` +
                    `§7ID: §f${collection.id}\n`
                );

            // Add toggle button for collection state
            menu.button(
                `${collection.enabled ? '§cDisable' : '§qEnable'} Collection\n§8Toggle availability`
            );

            menu.button("Back to Collections\n§8Return to collection list");

            const response = await menu.show(player);
            
            if (response.canceled || response.selection === 1) {
                await this.showGroupCollections(player, group);
                return;
            }

            if (response.selection === 0) {
                // Toggle collection state
                await CollectionManager.toggleCollection(collection.id, !collection.enabled);
                player.sendMessage(
                    `§q${collection.displayName} ${!collection.enabled ? '§qenabled' : '§cdisabled'}!`
                );
                await this.showGroupCollections(player, group);
            }

        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "ADMIN_UI");
            await this.showGroupCollections(player, group);
        }
    }

    /**     
     * Menu option 2 Create New Collection
     */
    /**
     * Displays the Create Collection Menu
     * @param {*} player 
     * @returns 
     */
    static async showCreateCollection(player) {
        try {
            Logger.log(`Starting collection creation process for ${player.name}`, "DEBUG", "ADMIN_UI");
            
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
                Logger.log("Collection creation cancelled at group selection", "DEBUG", "ADMIN_UI");
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
                Logger.log("Collection creation cancelled - no requirements added", "DEBUG", "ADMIN_UI");
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
                icon: selectedGroup.icon, //icon for the new collection
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
                        `§q§lCollection Created!\n` +
                        `§r§7Group: ${selectedGroup.name}\n` +
                        `§7ID: ${collection.id}`
                    );
                    Logger.log(`Collection created successfully: ${collection.id}`, "DEBUG", "ADMIN_UI");
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

    /**
     * Displays form to start the new collections requirements creation
     * @param {*} player 
     * @returns 
     */
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

    /**
     *  Displays form to start the new collections rewards creation
     * @param {*} player 
     * @returns 
     */
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

    /**
     * Displays menu system to choose the Requirement/Reward and amount for hte new collection
     * @param {*} player 
     * @param {*} title 
     * @returns 
     */
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
    
                // Pagination variables
                const ITEMS_PER_PAGE = 45;
                let currentPage = 0;
                const totalPages = Math.ceil(category.items.length / ITEMS_PER_PAGE);
    
                while (true) {
                    const startIndex = currentPage * ITEMS_PER_PAGE;
                    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, category.items.length);
                    const currentItems = category.items.slice(startIndex, endIndex);
    
                    const cfd = new ChestFormData('54')
                        .title(`Item Selector - Page ${currentPage + 1}/${totalPages}`)
                        .button(0, '§l§4Back', ['', '§r§cGo back to categories!'], 'textures/ui/arrow_l_default')
                        .button(8, '§l§4Cancel', ['', '§r§cCancel!'], 'textures/ui/cancel');
    
                    // Add pagination buttons if needed
                    if (currentPage > 0) {
                        cfd.button(3, '§l§ePrevious Page', ['', `§r§ePage ${currentPage}/${totalPages}`], 'textures/ui/arrow_left');
                    }
                    if (currentPage < totalPages - 1) {
                        cfd.button(5, '§l§eNext Page', ['', `§r§ePage ${currentPage + 2}/${totalPages}`], 'textures/ui/arrow_right');
                    }
    
                    // Add items for current page
                    let i = 9;
                    currentItems.forEach(item => {
                        cfd.button(i, item.id, [], item.id, 1);
                        i++;
                    });
    
                    const response = await cfd.show(player);
                    
                    // Handle navigation buttons
                    if (response.selection === 0) {
                        Logger.log("Returning to category selection", "DEBUG", "ADMIN_UI");
                        break;
                    }
                    if (response.selection === 8) {
                        Logger.log("Cancelled item selection", "DEBUG", "ADMIN_UI");
                        break;
                    }
                    if (response.selection === 3 && currentPage > 0) {
                        currentPage--;
                        continue;
                    }
                    if (response.selection === 5 && currentPage < totalPages - 1) {
                        currentPage++;
                        continue;
                    }
    
                    // Handle item selection
                    if (response.selection >= 9 && response.selection < 9 + currentItems.length) {
                        const selectedItem = currentItems[response.selection - 9];
                        Logger.log(`Item selected: ${selectedItem.id}`, "DEBUG", "ADMIN_UI");
                        return selectedItem.id;
                    }
                }
            }
        } catch (error) {
            Logger.log(`Error in creative selector: ${error}`, "ERROR", "ADMIN_UI");
            return null;
        }
    }

    /**
     * Menu Option 3 Storage Stats
     */
    /**
     * Diaplays storage stats for groups and collections
     * @param {*} player 
     * @returns 
     */
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

    /**
     * Menu option 4 System Management
     */
    /**
     * Displays system management menu
     * @param {*} player 
     * @returns 
     */
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
                    "§eLoad Test Data:\n" +
                    "§7- Loads 100 test collections\n" +
                    "§7- Spreads across all groups\n" +
                    "§7- Various requirements and rewards\n\n" +
                    "§eWarning: Choose these options carefully!"
                )
                .button("§cFull Reset\n§8Development only")
                .button("§6Load New Collections\n§8Add new defaults")
                .button("§eLoad Test Data\n§8Add test collections")
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
                case 2:
                    await this.showLoadTestDataConfirmation(player);
                    break;
                default:
                    await this.showMainMenu(player);
            }
        } catch (error) {
            Logger.log(`Error in system management menu: ${error}`, "ERROR", "ADMIN_UI");
            await this.showMainMenu(player);
        }
    }
    
    /**
     * Shows confirmation dialog for full system reset
     */
    static async showFullResetConfirmation(player) {
        try {
            const form = new MessageFormData()
                .title("§c§lFull System Reset")
                .body(
                    "§c§lWARNING: This will:\n\n" +
                    "§7- Delete ALL Skychievments data\n" +
                    "§7- Reset ALL player progress\n" +
                    "§7- Reset ALL groups to defaults\n" +
                    "§7- Reload ALL collections\n\n" +
                    "§c§lThis is for development only!\n" +
                    "§c§lThis cannot be undone!\n" +
                    "§cAre you absolutely sure?"
                )
                .button1("§c§lReset Everything")
                .button2("§qCancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                // Show processing message
                player.sendMessage("§6§lProcessing system reset...");
                
                // Execute reset
                const result = await SystemManager.resetSystem(player);
                
                if (result) {
                    Logger.log(`System reset completed: ${JSON.stringify(result)}`, "DEBUG", "ADMIN_UI");
                    player.sendMessage(
                        `§a§lReset Complete!\n` +
                        `§7Check logs for detailed results.`
                    );
                } else {
                    player.sendMessage("§c§lReset failed! Check logs for details.");
                }
            }

            await this.showSystemManagement(player);
        } catch (error) {
            Logger.log(`Error during full reset: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§c§lAn error occurred during system reset.');
            await this.showSystemManagement(player);
        }
    }

    /**
     * Shows confirmation dialog for system reload
     */
    static async showReloadConfirmation(player) {
        try {
            const form = new MessageFormData()
                .title("§6§lReload System")
                .body(
                    "This will:\n" +
                    "§7- Add any new groups from defaults\n" +
                    "§7- Add any new collections from defaults\n" +
                    "§7- Preserve all existing data and progress\n\n" +
                    "§7This operation is safe and can be used\n" +
                    "§7while players are online.\n\n" +
                    "Would you like to continue?"
                )
                .button1("§q§lReload System")
                .button2("Cancel");

            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                // Show processing message
                player.sendMessage("§6§lProcessing system reload...");
                
                // Execute reload
                const result = await SystemManager.reloadSystem(player);
                
                if (result) {
                    Logger.log(`System reload completed: ${JSON.stringify(result)}`, "DEBUG", "ADMIN_UI");
                    
                    // If nothing was added, show different message
                    if (result.newGroupsAdded === 0 && result.newCollectionsAdded === 0) {
                        player.sendMessage("§6§lNo new content found to add.");
                    }
                } else {
                    player.sendMessage("§c§lReload failed! Check logs for details.");
                }
            }

            await this.showSystemManagement(player);
        } catch (error) {
            Logger.log(`Error during system reload: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§c§lAn error occurred during system reload.');
            await this.showSystemManagement(player);
        }
    }

    static async showLoadTestDataConfirmation(player) {
        try {
            const form = new MessageFormData()
                .title("§e§lLoad Test Data")
                .body(
                    "§6This will:\n\n" +
                    "§7- Create a new 'Test' group if it doesn't exist\n" +
                    "§7- Generate 100 random test collections\n" +
                    "§7- Include random items from all available blocks\n" +
                    "§7- Random requirements (1-3 items each)\n" +
                    "§7- Random rewards including:\n" +
                    "  §7• Random items (1-32 each)\n" +
                    "  §7• Random enchantments\n" +
                    "  §7• Various effect commands\n\n" +
                    "§eExisting test collections will be replaced!\n" +
                    "§6Are you sure you want to proceed?"
                )
                .button1("§e§lLoad Test Data")
                .button2("§qCancel");
    
            const response = await form.show(player);
            
            if (!response.canceled && response.selection === 0) {
                player.sendMessage("§6§lGenerating and loading test collections...");
                
                const result = await loadTestCollections();
                
                if (result.success) {
                    Logger.log(`Test collections loaded: ${JSON.stringify(result)}`, "DEBUG", "ADMIN_UI");
                    player.sendMessage(
                        `§a§lTest Collections Loaded!\n` +
                        `§7Total Collections: ${result.totalCollections}\n` +
                        `§7Enabled: ${result.enabledCollections}\n` +
                        `§7Requirements per collection: ${result.requirements.min}-${result.requirements.max}\n` +
                        `§7Rewards per collection: ${result.rewards.min}-${result.rewards.max}`
                    );
                } else {
                    player.sendMessage("§c§lFailed to load test collections! Check logs for details.");
                }
            }
    
            await this.showSystemManagement(player);
        } catch (error) {
            Logger.log(`Error loading test data: ${error}`, "ERROR", "ADMIN_UI");
            player.sendMessage('§c§lAn error occurred while loading test data.');
            await this.showSystemManagement(player);
        }
    }
}

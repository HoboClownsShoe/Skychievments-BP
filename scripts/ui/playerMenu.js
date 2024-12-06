// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager } from '../config/collections.js';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';
import { Logger } from '../utils/logger.js';


export class PlayerMenu {
    static async showMainMenu(player) {
        try {
            // Get active groups and completed collections
            const activeGroups = await CollectionGroupManager.getActiveGroupsForPlayer(player);
            const completedCollections = await CollectionHandler.getCompletedCollections(player);
            
            const menu = new ActionFormData()
                .title("Skychievments")
                .body("§7Select a category to view:\n");

            // Add buttons for active groups
            activeGroups.forEach(group => {
                menu.button(group.displayName, group.icon);
            });

            // Add completed collections button if player has any
            if (completedCollections.length > 0) {
                menu.button("Completed Quests", "textures/ui/check.png");
            }

            const response = await menu.show(player);
            
            if (!response.canceled) {
                if (response.selection < activeGroups.length) {
                    // Selected a group
                    await this.showGroupCollections(player, activeGroups[response.selection]);
                } else if (completedCollections.length > 0 && response.selection === activeGroups.length) {
                    // Selected completed collections
                    await this.showCompletedCollections(player);
                }
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showGroupCollections(player, group) {
        try {
            const isEnabled = await CollectionGroupManager.isGroupEnabled(group.id);
            if (!isEnabled) {
                player.sendMessage('§cThis collection group is currently disabled.');
                await this.showMainMenu(player);
                return;
            }

            if (!CollectionGroupManager.isValidGroupId(group.id)) {
                Logger.log(`Invalid group ID: ${group.id}`, "ERROR", "PLAYER_UI");
                return;
            }

            // Get all collection data for this group in one check
            const { claimableCollections, progress } = await CollectionHandler.checkGroupProgress(player, group.id);
            
            const allCollections = CollectionManager.getEnabledCollections()
                .filter(c => c.parentId === group.id)
                .sort((a, b) => a.order - b.order);

            // Create lookup map for claimable collections
            const claimableMap = new Map(
                claimableCollections.map(cc => [cc.collection.id, cc])
            );

            // Separate collections
            const uncompletedCollections = allCollections.filter(c => !progress[c.id]?.completed);
            const completedCollections = allCollections.filter(c => progress[c.id]?.completed);

            // Build the body text
            let completedText = completedCollections.length > 0 ? 
                "\n§2§lCompleted:§r\n" + completedCollections
                    .map(c => `§7- ${c.displayName}`)
                    .join('\n') + '\n' : '';

            const menu = new ActionFormData()
                .title(`§p§r§e§f§i§x§r${group.displayName}`)
                .body(`${group.description}${completedText}\n`);

            // Add uncompleted collections as buttons
            if (uncompletedCollections.length > 0) {
                uncompletedCollections.forEach(collection => {
                    const collectionProgress = progress[collection.id];
                    const claimableData = claimableMap.get(collection.id);
                    let progressText = '';

                    // Build progress text for each requirement
                    collection.requirements.forEach((req, index) => {
                        const current = collectionProgress?.requirements[index]?.amount || 0;
                        progressText += `\n${claimableData ? '§2' : '§6'}${current}/${req.amount} ${req.itemId.split(':')[1]}`;
                    });

                    menu.button(
                      //  `${collection.displayName}${claimableData ? '\n§q(Claim It!)' : ''}`, collection.icon
                        `${claimableData ? '§q[*] ' : ''}${collection.displayName}`, collection.icon
                    );
                });
            } else {
                menu.button("§cNo Active Collections\n§8All collections completed!");
            }

            menu.button("Back to Menu", "textures/ui/imagelesshoverbg.png");

            const response = await menu.show(player);
            
            if (response.canceled) return;

            const lastButtonIndex = uncompletedCollections.length > 0 ? uncompletedCollections.length : 1;

            if (response.selection === lastButtonIndex) {
                await this.showMainMenu(player);
                return;
            }

            if (uncompletedCollections.length > 0) {
                const selectedCollection = uncompletedCollections[response.selection];
                const claimableData = claimableMap.get(selectedCollection.id);
                await this.showCollectionDetails(player, selectedCollection, claimableData);
            }

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "PLAYER_UI");
        }
    }

    static async showCollectionDetails(player, collection, claimableData) {
        try {
            // Build requirements text using progress data
            const requirementsText = collection.requirements.map((req, index) => {
                const current = claimableData?.requirements[index]?.amount || 0;
                return `§7${req.itemId.split(':')[1]}: ${claimableData ? '§q' : '§f'}${current}/${req.amount}`;
            }).join('\n');

            // Build rewards text
            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Requirements:${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}`
                );

            if (claimableData) {
                menu.button("Claim Reward\n§8Collect your reward!");
            }
            menu.button("Back\n§8Return to collections");

            const response = await menu.show(player);
            
            if (response.canceled) return;
            
            if (response.selection === 0 && claimableData) {
                const result = await CollectionHandler.claimCollection(player, claimableData);
                player.sendMessage(result.message);
                if (result.success) {
                    await this.showGroupCollections(player, CollectionGroupManager.getGroupById(collection.parentId));
                } else {
                    await this.showCollectionDetails(player, collection, claimableData);
                }
            } else {
                const group = CollectionGroupManager.getGroupById(collection.parentId);
                if (group) {
                    await this.showGroupCollections(player, group);
                } else {
                    Logger.log(`Group not found for collection ${collection.id}`, "ERROR", "PLAYER_UI");
                    await this.showMainMenu(player);
                }
            }
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collection details.');
        }
    }

    // Enhanced completed collections viewer for PlayerMenu
    static async showCompletedCollections(player) {
        try {
            // Get all completed collections data
            const completedCollections = await CollectionHandler.getCompletedCollections(player);
            if (completedCollections.length === 0) {
                player.sendMessage('§cNo completed collections found.');
                await this.showMainMenu(player);
                return;
            }

            // Get all collection data and organize by groups
            const allCollections = CollectionManager.getCollections();
            const groupedCollections = new Map();

            // Sort and group completed collections by their parent groups
            completedCollections.forEach(completed => {
                const collection = allCollections.find(c => c.id === completed.id);
                if (!collection) return;

                if (!groupedCollections.has(collection.parentId)) {
                    groupedCollections.set(collection.parentId, []);
                }
                groupedCollections.get(collection.parentId).push({
                    ...collection,
                    completedAt: completed.completedAt
                });
            });

            // Create menu with group selection
            const menu = new ActionFormData()
                .title("Completed Collections")
                .body(`§7Your completed collections:\n`);

            // Add each group that has completed collections
            const groupsWithCompletions = [];
            for (const [groupId, collections] of groupedCollections) {
                const group = CollectionGroupManager.getGroupById(groupId);
                if (!group) continue;

                groupsWithCompletions.push({
                    group,
                    collections: collections.sort((a, b) => a.order - b.order)
                });
            }

            // Sort groups by their configured order
            groupsWithCompletions.sort((a, b) => a.group.order - b.group.order);

            // Add menu buttons for each group
            groupsWithCompletions.forEach(({ group, collections }) => {
                menu.button(
                    `${group.displayName}`,
                    group.icon
                );
            });

            // Add back button
            menu.button("Back to Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < groupsWithCompletions.length) {
                    // Show collections for selected group
                    const selectedGroup = groupsWithCompletions[response.selection];
                    await this.showCompletedGroupDetails(
                        player,
                        selectedGroup.group,
                        selectedGroup.collections
                    );
                } else {
                    // Return to main menu
                    await this.showMainMenu(player);
                }
            }

        } catch (error) {
            Logger.log(`Error showing completed collections: ${error}`, "ERROR", "PLAYER_UI");
            await this.showMainMenu(player);
        }
    }

    static async showCompletedGroupDetails(player, group, completedCollections) {
        try {
            const menu = new ActionFormData()
                .title(`${group.displayName}`)
                .body(`§7View your completed achievements:\n`);

            // Sort collections by completion date, newest first
            const sortedCollections = completedCollections
                .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

            // Add each collection as a button
            sortedCollections.forEach(collection => {
                menu.button(
                    `${collection.displayName}`,
                    collection.icon
                );
            });

            // Add back button
            menu.button("Back to Categories", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < sortedCollections.length) {
                    // Show details for selected collection
                    await this.showCompletedCollectionDetails(player, sortedCollections[response.selection]);
                } else {
                    // Return to completed collections menu
                    await this.showCompletedCollections(player);
                }
            }

        } catch (error) {
            Logger.log(`Error showing completed group details: ${error}`, "ERROR", "PLAYER_UI");
            await this.showCompletedCollections(player);
        }
    }

    static async showCompletedCollectionDetails(player, collection) {
        try {
            // Format collection requirements and rewards for display
            const requirementsText = collection.requirements
                .map(req => `§7- ${req.amount}x ${req.itemId.split(':')[1]}`)
                .join('\n');

            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            // Create detailed view menu
            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Requirements:\n${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}\n\n` +
                    `§7Completed: §a✔`
                )
                .button("Back to Collections", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                // Return to group details
                await this.showCompletedGroupDetails(
                    player,
                    CollectionGroupManager.getGroupById(collection.parentId),
                    (await CollectionHandler.getCompletedCollections(player))
                        .map(c => ({
                            ...CollectionManager.getCollections().find(col => col.id === c.id),
                            completedAt: c.completedAt
                        }))
                        .filter(c => c.parentId === collection.parentId)
                );
            }

        } catch (error) {
            Logger.log(`Error showing completed collection details: ${error}`, "ERROR", "PLAYER_UI");
            await this.showCompletedCollections(player);
        }
    }

    // Helper method to get formatted space information for a group
    static async #getGroupSpaceInfo(groupId) {
        try {
            const stats = await CollectionManager.getStorageStats(groupId);
            if (!stats || !stats[groupId]) return "§cUnable to get space info";

            const usedKB = (stats[groupId].usedSpace / 1024).toFixed(1);
            const totalKB = 32;
            const percent = stats[groupId].spaceUsedPercent;

            return `§7${usedKB}KB/${totalKB}KB (${percent}% used)`;
        } catch (error) {
            Logger.log(`Error getting group space info: ${error}`, "ERROR", "PLAYER_UI");
            return "§cUnable to get space info";
        }
    }
}
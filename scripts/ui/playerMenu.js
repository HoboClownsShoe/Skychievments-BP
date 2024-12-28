// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionStorage } from '../utils/collectionStorage.js';
import { CollectionHandler } from '../handlers/collectionHandler.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';
import { Logger } from '../utils/logger.js';
import { world } from "@minecraft/server";
import { KillTracker } from "detectors/killTracker.js"

export class PlayerMenu {
    static async showMainMenu(player) {
        try {
            const menu = new ActionFormData()
                .title("Skychievments")
                .body("§7Select a category to view:\n")
                .button("Quests", "textures/ui/groupIcons/quest_book.png")
                .button("Stats", "textures/ui/groupIcons/stats_icon.png");

            const response = await menu.show(player);
            
            if (!response.canceled) {
                switch(response.selection) {
                    case 0:
                        await this.showCollectionsMenu(player);
                        break;
                    case 1:
                        await this.showStatsMenu(player);
                        break;
                }
            }
        } catch (error) {
            Logger.log(`Error in main menu: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while opening the menu.');
        }
    }

    static async showStatsMenu(player) {
        try {
            const menu = new ActionFormData()
                .title("Statistics")
                .body("§7View your gameplay statistics:\n")
                .button("Mob Kills\n§8Track your monster hunts", "textures/ui/sword.png")
                .button("Items Collected\n§8View item collection stats", "textures/ui/inventory_icon.png")
                .button("Player Stats\n§8General gameplay statistics", "textures/ui/player.png")
                .button("Back to Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);
            
            if (!response.canceled) {
                switch(response.selection) {
                    case 0:
                        await this.showMobKillStats(player);
                        break;
                    case 1:
                        await this.showItemStats(player);
                        break;
                    case 2:
                        await this.showPlayerStats(player);
                        break;
                    case 3:
                        await this.showMainMenu(player);
                        break;
                }
            }
        } catch (error) {
            Logger.log(`Error in stats menu: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing statistics.');
        }
    }
    

    static async showMobKillStats(player) {
        try {
            // Get kill stats from storage
            const propertyKey = 'kills_' + player.id;
            const killStats = world.getDynamicProperty(propertyKey) || '';
            
            // Parse kill stats
            const stats = {};
            killStats.split(',').forEach(stat => {
                if (!stat) return;
                const [code, count] = stat.split(':');
                if (code && count) {
                    stats[code] = parseInt(count);
                }
            });

            // Format the kill statistics
            let statsText = '';
            let totalKills = 0;

            // Convert stats to array for sorting
            const sortedStats = Object.entries(stats)
                .map(([code, count]) => ({
                    code,
                    count,
                    name: KillTracker.getFullMobType(code)?.replace('minecraft:', '').split('_').map(
                        word => word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                }))
                .filter(stat => stat.name) // Filter out any unknown mob types
                .sort((a, b) => b.count - a.count); // Sort by kill count descending

            // Calculate total kills and create display text
            totalKills = sortedStats.reduce((sum, stat) => sum + stat.count, 0);

            if (sortedStats.length > 0) {
                statsText = sortedStats
                    .map(stat => `§7${stat.name}: §f${stat.count}`)
                    .join('\n');
            } else {
                statsText = '§7No mobs killed yet.';
            }

            const menu = new ActionFormData()
                .title("Mob Kill Statistics")
                .body(
                    `§7Your total mob kills: §f${totalKills}\n\n` +
                    `§lKill Counts:\n` +
                    statsText
                )
                .button("Back to Stats Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);
            
            if (!response.canceled) {
                await this.showStatsMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing mob kill stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing kill statistics.');
        }
    }

    static async showItemStats(player) {
        try {
            const menu = new ActionFormData()
                .title("Item Statistics")
                .body(
                    "nothing to see here....."
                )
                .button("Back to Stats Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);
            
            if (!response.canceled) {
                await this.showStatsMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing item stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing item statistics.');
        }

    }

    static async showPlayerStats(player) {
        try {
            const menu = new ActionFormData()
                .title("Player Statistics")
                .body(
                    "nothing to see here....."
                )
                .button("Back to Stats Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);
            
            if (!response.canceled) {
                await this.showStatsMenu(player);
            }
        } catch (error) {
            Logger.log(`Error showing player stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing player statistics.');
        }

    }


    static async showCollectionsMenu(player) {
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

            menu.button("Back to Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);
            
            if (!response.canceled) {
                if (response.selection < activeGroups.length) {
                    await this.showGroupCollections(player, activeGroups[response.selection]);
                } else if (completedCollections.length > 0 && response.selection === activeGroups.length) {
                    await this.showCompletedCollections(player);
                }
                else {
                    await this.showMainMenu(player);
                }
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while opening the menu.');
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
            
            // Get collections using new storage system
            const allCollections = CollectionStorage.getCollectionsByGroup(group.id)
                .filter(c => c.enabled)
                .sort((a, b) => a.order - b.order);

            // Create lookup map for claimable collections
            const claimableMap = new Map(
                claimableCollections.map(cc => [cc.collection.id, cc])
            );

            // Separate collections
            const uncompletedCollections = allCollections.filter(c => !progress[c.id]?.completed);
            const completedCollections = allCollections.filter(c => progress[c.id]?.completed);

            // Build the body text
            const completedText = completedCollections.length > 0 ? 
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
                    
                    // Build progress text for each requirement
                    const progressText = collection.requirements
                        .map((req, index) => {
                            const current = collectionProgress?.requirements[index]?.amount || 0;
                            return `\n${claimableData ? '§2' : '§6'}${current}/${req.amount} ${req.itemId.split(':')[1]}`;
                        })
                        .join('');

                    menu.button(
                        `${claimableData ? '§q[*] ' : ''}${collection.displayName}`,
                        collection.icon
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
                await this.showCollectionsMenu(player);
                return;
            }

            if (uncompletedCollections.length > 0) {
                const selectedCollection = uncompletedCollections[response.selection];
                const claimableData = claimableMap.get(selectedCollection.id);
                await this.showCollectionDetails(player, selectedCollection, claimableData);
            }

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collections.');
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
                    `§7Requirements:\n${requirementsText}\n\n` +
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
                    await this.showCollectionsMenu(player);
                }
            }
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collection details.');
        }
    }

    static async showCompletedCollections(player) {
        try {
            // Get all completed collections data
            const completedCollections = await CollectionHandler.getCompletedCollections(player);
            if (completedCollections.length === 0) {
                player.sendMessage('§cNo completed collections found.');
                await this.showMainMenu(player);
                return;
            }

            // Get all collections from storage and organize by groups
            const groupedCollections = new Map();

            // Sort and group completed collections by their parent groups
            for (const completed of completedCollections) {
                const collection = CollectionStorage.getCollection(completed.id);
                if (!collection) continue;

                if (!groupedCollections.has(collection.parentId)) {
                    groupedCollections.set(collection.parentId, []);
                }
                groupedCollections.get(collection.parentId).push({
                    ...collection,
                    completedAt: completed.completedAt
                });
            }

            // Create menu with group selection
            const menu = new ActionFormData()
                .title("Completed Collections")
                .body(`§7Your completed collections:\n`);

            // Process groups with completions
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
            groupsWithCompletions.forEach(({ group }) => {
                menu.button(group.displayName, group.icon);
            });

            menu.button("Back to Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < groupsWithCompletions.length) {
                    const selectedGroup = groupsWithCompletions[response.selection];
                    await this.showCompletedGroupDetails(
                        player,
                        selectedGroup.group,
                        selectedGroup.collections
                    );
                } else {
                    await this.showCollectionsMenu(player);
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
                .title(group.displayName)
                .body(`§7View your completed achievements:\n`);

            // Sort collections by completion date, newest first
            const sortedCollections = completedCollections
                .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

            sortedCollections.forEach(collection => {
                menu.button(collection.displayName, collection.icon);
            });

            menu.button("Back to Categories", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < sortedCollections.length) {
                    await this.showCompletedCollectionDetails(
                        player,
                        sortedCollections[response.selection]
                    );
                } else {
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
            const requirementsText = collection.requirements
                .map(req => `§7- ${req.amount}x ${req.itemId.split(':')[1]}`)
                .join('\n');

            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

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
                await this.showCompletedGroupDetails(
                    player,
                    CollectionGroupManager.getGroupById(collection.parentId),
                    (await CollectionHandler.getCompletedCollections(player))
                        .map(c => {
                            const col = CollectionStorage.getCollection(c.id);
                            return col ? { ...col, completedAt: c.completedAt } : null;
                        })
                        .filter(c => c && c.parentId === collection.parentId)
                );
            }

        } catch (error) {
            Logger.log(`Error showing completed collection details: ${error}`, "ERROR", "PLAYER_UI");
            await this.showCompletedCollections(player);
        }
    }
}
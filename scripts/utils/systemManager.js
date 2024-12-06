import { world } from '@minecraft/server';
import { Logger } from '../utils/logger.js';
import { CollectionManager } from '../config/collections.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';

export class SystemManager {
    static #DYNAMIC_PROPERTY_PREFIXES = [
        'sk_collections_group_',
        'sk_collection_id_counter_',
        'sk_group_states',
        'sk_logger_debug',
        'progress_'
    ];

    /**
     * Completely resets the system to initial state
     * Development use only - will erase all progress and settings
     */
    static async resetSystem(player) {
        try {
            Logger.log("Starting complete system reset...", "DEBUG", "SYSTEM");

            // 1. Clear all dynamic properties
            const properties = world.getDynamicPropertyIds();
            let clearedCount = 0;

            for (const property of properties) {
                if (this.#DYNAMIC_PROPERTY_PREFIXES.some(prefix => property.startsWith(prefix))) {
                    world.setDynamicProperty(property, undefined);
                    clearedCount++;
                    Logger.log(`Cleared property: ${property}`, "DEBUG", "SYSTEM");
                }
            }

            // 2. Reset online players
            for (const currentPlayer of world.getAllPlayers()) {
                if (currentPlayer.hasTag('skychievements')) {
                    currentPlayer.removeTag('skychievements');
                    Logger.log(`Reset player state: ${currentPlayer.name}`, "DEBUG", "SYSTEM");
                }
            }

            // 3. Reset collection groups to defaults
            const groupsReset = await CollectionGroupManager.resetToDefaults();
            Logger.log(`Groups reset result: ${groupsReset}`, "DEBUG", "SYSTEM");

            // 4. Reload collections for all groups
            let collectionsReloaded = true;
            for (const groupId of CollectionGroupManager.getGroupIds()) {
                const success = await CollectionManager.loadCollections(groupId);
                if (!success) {
                    collectionsReloaded = false;
                    Logger.log(`Failed to reload collections for group ${groupId}`, "ERROR", "SYSTEM");
                }
            }

            const summary = {
                propertiesCleared: clearedCount,
                groupsReset: groupsReset,
                collectionsReloaded: collectionsReloaded
            };

            Logger.log(`System reset complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");

            // 5. Notify the initiating player
            if (player) {
                player.sendMessage(
                    `§q§lSystem Reset Complete\n` +
                    `§7Properties Cleared: §f${clearedCount}\n` +
                    `§7Groups Reset: §f${groupsReset ? '§aSuccess' : '§cFailed'}\n` +
                    `§7Collections Reloaded: §f${collectionsReloaded ? '§aSuccess' : '§cFailed'}`
                );
            }

            return summary;

        } catch (error) {
            Logger.log(`Error during system reset: ${error}`, "ERROR", "SYSTEM");
            if (player) {
                player.sendMessage('§c§lError during system reset. Check logs for details.');
            }
            return null;
        }
    }

    /**
     * Reloads the system, adding any new groups and collections
     * Preserves existing data and player progress
     */
    static async reloadSystem(player) {
        try {
            Logger.log("Starting system reload...", "DEBUG", "SYSTEM");

            // 1. Load any new groups
            const newGroups = await CollectionGroupManager.loadNewDefaultGroups();
            Logger.log(`Added ${newGroups} new groups`, "DEBUG", "SYSTEM");

            // 2. Load any new collections
            const newCollections = await CollectionManager.loadNewDefaultCollections();
            Logger.log(`Added ${newCollections} new collections`, "DEBUG", "SYSTEM");

            const summary = {
                newGroupsAdded: newGroups,
                newCollectionsAdded: newCollections
            };

            Logger.log(`System reload complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");

            // 3. Notify the initiating player
            if (player) {
                player.sendMessage(
                    `§q§lSystem Reload Complete\n` +
                    `§7New Groups Added: §f${newGroups}\n` +
                    `§7New Collections Added: §f${newCollections}`
                );
            }

            return summary;

        } catch (error) {
            Logger.log(`Error during system reload: ${error}`, "ERROR", "SYSTEM");
            if (player) {
                player.sendMessage('§c§lError during system reload. Check logs for details.');
            }
            return null;
        }
    }
}
// scripts/utils/systemManager.js
import { world } from '@minecraft/server';
import { Logger } from '../utils/logger.js';
import { CollectionManager, CollectionStorage, CollectionHandler, CollectionGroupManager } from './collectionsManager.js';
import { QuestPointsManager } from './questPointManager.js'
import { DatabaseManager } from './databaseManager.js';
import { JsonDatabase } from '../database/con-database.js';
import { MilestoneManager } from './milestoneManager.js';

export class SystemManager {
    // Property prefixes that we manage
    static #DYNAMIC_PROPERTY_PREFIXES = [
        'collection:', // New prefix for individual collections
        'group:', // New prefix for group indices
        'sk_group_states',
        'sk_logger_debug',
        'progress_'
    ];

    // /**
    //  * Completely resets the system to initial state
    //  * Development use only - will erase all progress and settings
    //  * @param {Player} player - The player initiating the reset (for notifications)
    //  * @returns {Object|null} Summary of reset operations
    //  */
    // static async resetSystem(player) {
    //     try {
    //         Logger.log("Starting complete system reset...", "DEBUG", "SYSTEM");

    //         // 1. Clear all managed dynamic properties
    //         const properties = world.getDynamicPropertyIds();
    //         let clearedCount = 0;

    //         for (const property of properties) {
    //             if (this.#DYNAMIC_PROPERTY_PREFIXES.some(prefix => property.startsWith(prefix))) {
    //                 world.setDynamicProperty(property, undefined);
    //                 clearedCount++;
    //                 Logger.log(`Cleared property: ${property}`, "DEBUG", "SYSTEM");
    //             }
    //         }

    //         const playerProperties = player.getDynamicPropertyIds();
    //         for (const playProps of playerProperties) { 
    //             player.setDynamicProperty(playProps, undefined);
    //             Logger.log(`Cleared property: ${playProps}`, "DEBUG", "SYSTEM");
    //         }

    //         // 2. Reset player states
    //         for (const currentPlayer of world.getAllPlayers()) {
    //             if (currentPlayer.hasTag('skychievements')) {
    //                 currentPlayer.removeTag('skychievements');                    

    //                 Logger.log(`Reset player state: ${currentPlayer.name}`, "DEBUG", "SYSTEM");
    //             }
    //         }

    //         // 3. Reset collection groups
    //         const groupsReset = await CollectionGroupManager.resetToDefaults();
    //         Logger.log(`Groups reset result: ${groupsReset}`, "DEBUG", "SYSTEM");

    //         // 4. Initialize storage and collection systems
    //         let storageInitialized = false;
    //         let collectionsInitialized = false;

    //         try {
    //             // Initialize storage first
    //             CollectionStorage.initialize();
    //             storageInitialized = true;
    //             Logger.log("Collection storage system initialized", "DEBUG", "SYSTEM");

    //             // Initialize collection manager (which will load defaults)
    //             collectionsInitialized = await CollectionManager.initialize();
    //             Logger.log("Collection manager initialized", "DEBUG", "SYSTEM");
    //         } catch (initError) {
    //             Logger.log(`Error during initialization: ${initError}`, "ERROR", "SYSTEM");
    //         }

    //         // 5. Load collections for each group
    //         let groupLoadSuccess = true;
    //         if (collectionsInitialized) {
    //             for (const groupId of CollectionGroupManager.getGroupIds()) {
    //                 const group = CollectionGroupManager.getGroupById(groupId);
    //                 if (!group) continue;

    //                 try {
    //                     const groupCollections = CollectionStorage.getCollectionsByGroup(groupId);
    //                     Logger.log(`Loaded ${groupCollections.length} collections for group: ${group.displayName}`, "DEBUG", "SYSTEM");
    //                 } catch (groupError) {
    //                     Logger.log(`Error loading collections for group ${group.displayName}: ${groupError}`, "ERROR", "SYSTEM");
    //                     groupLoadSuccess = false;
    //                 }
    //             }
    //         }

    //         const summary = {
    //             propertiesCleared: clearedCount,
    //             groupsReset,
    //             storageInitialized,
    //             collectionsInitialized,
    //             groupLoadSuccess,
    //         };

    //         Logger.log(`System reset complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");

    //         // 6. Notify the initiating player
    //         if (player) {
    //             player.sendMessage(
    //                 `§q§lSystem Reset Complete\n` +
    //                 `§7Properties Cleared: §f${clearedCount}\n` +
    //                 `§7Groups Reset: §f${groupsReset ? '§aSuccess' : '§cFailed'}\n` +
    //                 `§7Storage Initialized: §f${storageInitialized ? '§aSuccess' : '§cFailed'}\n` +
    //                 `§7Collections Initialized: §f${collectionsInitialized ? '§aSuccess' : '§cFailed'}\n` +
    //                 `§7Group Load: §f${groupLoadSuccess ? '§aSuccess' : '§cFailed'}`
    //             );
    //         }

    //         return summary;

    //     } catch (error) {
    //         Logger.log(`Critical error during system reset: ${error}`, "ERROR", "SYSTEM");
    //         if (player) {
    //             player.sendMessage('§c§lCritical error during system reset. Check logs for details.');
    //         }
    //         return null;
    //     }
    // }

    // static async resetSystem(player) {
    //     try {
    //         Logger.log("Starting complete system reset...", "DEBUG", "SYSTEM");
    
    //         let summary = {
    //             databasesReset: 0,
    //             systemsReinitialized: 0,
    //             errors: []
    //         };
    
    //         // 1. Dispose all databases
    //         Logger.log("Disposing all database instances...", "DEBUG", "SYSTEM");
            
            
 

    
    //         // 2. Clear player states
    //         Logger.log("Clearing player states...", "DEBUG", "SYSTEM");
    //         for (const currentPlayer of world.getAllPlayers()) {
    //             try {
    //                 if (currentPlayer.hasTag('skychievments')) {
    //                     currentPlayer.removeTag('skychievments');
    //                 }
    //             } catch (playerError) {
    //                 summary.errors.push(`Failed to clear state for player ${currentPlayer.name}: ${playerError}`);
    //             }
    //         }
    
    //         // 3. Reinitialize all systems
    //         Logger.log("Reinitializing systems...", "DEBUG", "SYSTEM");
    //         const reinitResults = await DatabaseManager.reinitializeAll();
            
    //         summary.systemsReinitialized = reinitResults.success.length;
    //         if (reinitResults.failed.length > 0) {
    //             reinitResults.failed.forEach(({ dbName, error }) => {
    //                 summary.errors.push(`Failed to reinitialize ${dbName}: ${error}`);
    //             });
    //         }
    
    //         // Log results
    //         Logger.log(`System reset complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");
    
    //         if (player) {
    //             let message = `§q§lSystem Reset Complete\n` +
    //                 `§7Systems Reinitialized: §f${summary.systemsReinitialized}`;
                
    //             if (summary.errors.length > 0) {
    //                 message += `\n§cErrors: §f${summary.errors.length}`;
    //                 message += `\n§7Check logs for details`;
    //             }
    
    //             player.sendMessage(message);
    //         }
    
    //         return summary;
    
    //     } catch (error) {
    //         Logger.log(`Critical error during system reset: ${error}`, "ERROR", "SYSTEM");
    //         if (player) {
    //             player.sendMessage('§c§lCritical error during system reset. Check logs for details.');
    //         }
    //         return null;
    //     }
    // }

    static async resetSystem(player) {
        try {
            Logger.log("Starting complete system reset...", "DEBUG", "SYSTEM");
    
            let summary = {
                databasesCleared: 0,
                systemsReinitialized: 0,
                errors: []
            };
    
            // Clear all known databases
            try {
                const currentPlayer = world.getAllPlayers()[0]
                world.clearDynamicProperties();
                currentPlayer.clearDynamicProperties();

                // Collection Storage DB
                const collectionDb = new JsonDatabase("skychievments_collections");
                collectionDb.clear();
                summary.databasesCleared++;
    
                // Groups DB
                const groupsDb = new JsonDatabase("skychievments_groups");
                groupsDb.clear();
                summary.databasesCleared++;
    
                // Logger DB
                const loggerDb = new JsonDatabase("skychievments_logger");
                loggerDb.clear();
                summary.databasesCleared++;
    
                // Progress DB
                const progressDb = new JsonDatabase("skychievments_progress");
                progressDb.clear();
                summary.databasesCleared++;

                // milestone DB
                const milestoneDb = new JsonDatabase("skychievments_milestones");
                milestoneDb.clear();
                summary.databasesCleared++;

                //milestoneProgress db
                const milestoneProgressDb = new JsonDatabase("skychievments_milestone_progress");
                milestoneProgressDb.clear();
                summary.databasesCleared++;
    
                Logger.log("All databases cleared", "DEBUG", "SYSTEM");
            } catch (dbError) {
                const errorMsg = `Error clearing databases: ${dbError}`;
                Logger.log(errorMsg, "ERROR", "SYSTEM");
                summary.errors.push(errorMsg);
            }
    
            // Clear player states
            for (const currentPlayer of world.getAllPlayers()) {
                try {
                    if (currentPlayer.hasTag('skychievments')) {
                        currentPlayer.removeTag('skychievments');
                    }                
                } catch (playerError) {
                    summary.errors.push(`Failed to clear state for player ${currentPlayer.name}: ${playerError}`);
                }
            }

            // Reinitialize systems
            try {   
                // Initialize logger
                if (await Logger.initialize()) {
                    summary.systemsReinitialized++;
                }    
                
                // Initialize collection manager
                if (await CollectionManager.initialize()) {
                    summary.systemsReinitialized++;
                }
    
                // Initialize collection handler
                if (await CollectionHandler.initialize()) {
                    summary.systemsReinitialized++;
                }
    
                // initialze milestone manager
                if (await MilestoneManager.initialize()) {
                    summary.systemsReinitialized++;
                }

                if (await QuestPointsManager.initialize()) {
                    summary.systemsReinitialized++
                }
                
                Logger.log("Systems reinitialized", "DEBUG", "SYSTEM");
            } catch (initError) {
                const errorMsg = `Error reinitializing systems: ${initError}`;
                Logger.log(errorMsg, "ERROR", "SYSTEM");
                summary.errors.push(errorMsg);
            }
    
            // Log results
            Logger.log(`System reset complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");
    
            if (player) {
                let message = `§q§lSystem Reset Complete\n` +
                    `§7Databases Cleared: §f${summary.databasesCleared}\n` +
                    `§7Systems Reinitialized: §f${summary.systemsReinitialized}`;
                
                if (summary.errors.length > 0) {
                    message += `\n§cErrors: §f${summary.errors.length}`;
                    message += `\n§7Check logs for details`;
                }
    
                player.sendMessage(message);
            }
    
            return summary;
    
        } catch (error) {
            Logger.log(`Critical error during system reset: ${error}`, "ERROR", "SYSTEM");
            if (player) {
                player.sendMessage('§c§lCritical error during system reset. Check logs for details.');
            }
            return null;
        }
    }


    /**
     * Reloads the system, adding any new collections while preserving existing data
     * @param {Player} player - The player initiating the reload (for notifications)
     * @returns {Object|null} Summary of reload operations
     */
    static async reloadSystem(player) {
        try {
            Logger.log("Starting system reload...", "DEBUG", "SYSTEM");

            const summary = {
                storageInitialized: false,
                collectionsProcessed: 0,
                newCollectionsAdded: 0,
                collectionsUpdated: 0,
                groupsProcessed: 0,
                errors: []
            };

            // 1. Ensure storage is initialized
            try {
                CollectionStorage.initialize();
                summary.storageInitialized = true;
                Logger.log("Storage system initialized", "DEBUG", "SYSTEM");
            } catch (storageError) {
                const errorMsg = `Failed to initialize storage: ${storageError}`;
                Logger.log(errorMsg, "ERROR", "SYSTEM");
                summary.errors.push(errorMsg);
                return summary;
            }

            // 2. Process each group and its collections
            for (const groupId of CollectionGroupManager.getGroupIds()) {
                try {
                    const group = CollectionGroupManager.getGroupById(groupId);
                    if (!group) continue;

                    // Get default collections for this group
                    const defaultCollections = CollectionManager.getDefaultCollectionsForGroup(groupId);
                    if (!defaultCollections || defaultCollections.length === 0) continue;

                    // Get existing collections from storage
                    const existingCollections = CollectionStorage.getCollectionsByGroup(groupId);
                    const existingIds = new Set(existingCollections.map(c => c.id));

                    // Process each default collection
                    for (const defaultCollection of defaultCollections) {
                        try {
                            if (!existingIds.has(defaultCollection.id)) {
                                // Add new collection
                                const success = await CollectionStorage.saveCollection(defaultCollection);
                                if (success) {
                                    summary.newCollectionsAdded++;
                                    Logger.log(`Added new collection: ${defaultCollection.id}`, "DEBUG", "SYSTEM");
                                }
                            } else {
                                // Update existing collection while preserving enabled state
                                const existingCollection = existingCollections.find(c => c.id === defaultCollection.id);
                                if (existingCollection) {
                                    // Preserve the enabled state and any custom fields
                                    const updatedCollection = {
                                        ...defaultCollection,
                                        enabled: existingCollection.enabled
                                    };
                                    const success = await CollectionStorage.saveCollection(updatedCollection);
                                    if (success) {
                                        summary.collectionsUpdated++;
                                        Logger.log(`Updated collection: ${defaultCollection.id}`, "DEBUG", "SYSTEM");
                                    }
                                }
                            }
                            summary.collectionsProcessed++;
                        } catch (collectionError) {
                            const errorMsg = `Error processing collection ${defaultCollection.id}: ${collectionError}`;
                            Logger.log(errorMsg, "ERROR", "SYSTEM");
                            summary.errors.push(errorMsg);
                        }
                    }
                    summary.groupsProcessed++;

                } catch (groupError) {
                    const errorMsg = `Error processing group ${groupId}: ${groupError}`;
                    Logger.log(errorMsg, "ERROR", "SYSTEM");
                    summary.errors.push(errorMsg);
                }
            }

            Logger.log(`System reload complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");

            // Notify the initiating player
            if (player) {
                let message = `§q§lSystem Reload Complete\n` +
                    `§7Groups Processed: §f${summary.groupsProcessed}\n` +
                    `§7Collections Processed: §f${summary.collectionsProcessed}\n` +
                    `§7New Collections Added: §f${summary.newCollectionsAdded}\n` +
                    `§7Collections Updated: §f${summary.collectionsUpdated}`;

                if (summary.errors.length > 0) {
                    message += `\n§cErrors Encountered: §f${summary.errors.length}`;
                    message += `\n§7Check logs for details`;
                }

                player.sendMessage(message);
            }

            return summary;

        } catch (error) {
            Logger.log(`Critical error during system reload: ${error}`, "ERROR", "SYSTEM");
            if (player) {
                player.sendMessage('§c§lCritical error during system reload. Check logs for details.');
            }
            return null;
        }
    }



    /**
     * Gets the current system status
     * @returns {Object} System status information
     */
    static async getSystemStatus() {
        try {
            const collections = CollectionStorage.getAllCollections();
            const stats = CollectionStorage.getStorageStats();
            
            return {
                totalCollections: collections.length,
                enabledCollections: collections.filter(c => c.enabled).length,
                storageStats: stats,
                groupsInitialized: true, // Could be enhanced to check group state
                storageInitialized: true
            };
        } catch (error) {
            Logger.log(`Error getting system status: ${error}`, "ERROR", "SYSTEM");
            return null;
        }
    }
}
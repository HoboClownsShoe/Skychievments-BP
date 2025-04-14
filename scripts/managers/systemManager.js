// scripts/utils/systemManager.js
import { world } from '@minecraft/server';
import { Logger } from '../utils/logger.js';
import { CollectionManager, CollectionStorage, CollectionHandler, CollectionGroupManager } from './collectionsManager.js';
import { QuestPointsManager } from './questPointManager.js'
import { DatabaseManager } from './databaseManager.js';
import { JsonDatabase } from '../database/con-database.js';
import { MilestoneManager, MilestoneStorage } from './milestoneManager.js';

export class SystemManager {
    // Property prefixes that we manage
    static #DYNAMIC_PROPERTY_PREFIXES = [
        'collection:', // New prefix for individual collections
        'group:', // New prefix for group indices
        'sk_group_states',
        'sk_logger_debug',
        'progress_'
    ];

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
     * Reloads the system, adding any new collections and milestones while preserving existing data
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
                milestonesProcessed: 0,
                newMilestonesAdded: 0,
                milestonesUpdated: 0,
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

            // 3. Process milestones
            try {
                // Make sure MilestoneStorage is initialized
                if (!MilestoneStorage.initialize()) {
                    const errorMsg = "Failed to initialize milestone storage";
                    Logger.log(errorMsg, "ERROR", "SYSTEM");
                    summary.errors.push(errorMsg);
                } else {
                    // Get default milestones from MilestoneManager
                    const { MILESTONES } = await import('../config/milestones.js');
                    
                    if (MILESTONES) {
                        // Process each milestone group and its milestones
                        for (const [groupId, defaultMilestones] of Object.entries(MILESTONES)) {
                            if (Array.isArray(defaultMilestones)) {
                                for (const defaultMilestone of defaultMilestones) {
                                    try {
                                        if (!defaultMilestone?.id) continue;
                                        
                                        const existingMilestone = MilestoneStorage.getMilestone(defaultMilestone.id);
                                        
                                        if (!existingMilestone) {
                                            // Add new milestone
                                            const success = await MilestoneStorage.saveMilestone(defaultMilestone);
                                            if (success) {
                                                summary.newMilestonesAdded++;
                                                Logger.log(`Added new milestone: ${defaultMilestone.id}`, "DEBUG", "SYSTEM");
                                            }
                                        } else {
                                            // Update existing milestone while preserving any runtime state
                                            // Determine what fields to preserve (this will depend on your milestone structure)
                                            const updatedMilestone = {
                                                ...defaultMilestone,
                                                // Preserve any runtime fields here if needed
                                            };
                                            const success = await MilestoneStorage.saveMilestone(updatedMilestone);
                                            if (success) {
                                                summary.milestonesUpdated++;
                                                Logger.log(`Updated milestone: ${defaultMilestone.id}`, "DEBUG", "SYSTEM");
                                            }
                                        }
                                        summary.milestonesProcessed++;
                                    } catch (milestoneError) {
                                        const errorMsg = `Error processing milestone ${defaultMilestone?.id}: ${milestoneError}`;
                                        Logger.log(errorMsg, "ERROR", "SYSTEM");
                                        summary.errors.push(errorMsg);
                                    }
                                }
                            }
                        }
                    } else {
                        const errorMsg = "No default milestones found in config";
                        Logger.log(errorMsg, "ERROR", "SYSTEM");
                        summary.errors.push(errorMsg);
                    }
                }
            } catch (milestoneError) {
                const errorMsg = `Error processing milestones: ${milestoneError}`;
                Logger.log(errorMsg, "ERROR", "SYSTEM");
                summary.errors.push(errorMsg);
            }

            Logger.log(`System reload complete: ${JSON.stringify(summary)}`, "DEBUG", "SYSTEM");

            // Notify the initiating player
            if (player) {
                let message = `§q§lSystem Reload Complete\n` +
                    `§7Groups Processed: §f${summary.groupsProcessed}\n` +
                    `§7Collections Processed: §f${summary.collectionsProcessed}\n` +
                    `§7New Collections Added: §f${summary.newCollectionsAdded}\n` +
                    `§7Collections Updated: §f${summary.collectionsUpdated}\n` +
                    `§7Milestones Processed: §f${summary.milestonesProcessed}\n` +
                    `§7New Milestones Added: §f${summary.newMilestonesAdded}\n` +
                    `§7Milestones Updated: §f${summary.milestonesUpdated}`;

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
// scripts/handlers/collectionHandler.js
import { world } from '@minecraft/server';
import { CollectionManager } from '../config/collections.js';
import { Logger } from '../utils/logger.js';

export class CollectionHandler {
    static async checkProgress(player) {
        try {
            const container = player.getComponent('inventory').container;
            const collections = CollectionManager.getEnabledCollections();
            const progress = this.#getPlayerProgress(player);
            let updated = false;

            for (const collection of collections) {
                if (progress[collection.id]?.completed) continue;

                let totalCount = 0;
                for (let i = 0; i < container.size; i++) {
                    const item = container.getItem(i);
                    if (item?.typeId === collection.itemId) {
                        totalCount += item.amount;
                    }
                }

                const currentProgress = progress[collection.id] || { amount: 0, completed: false };
                if (totalCount >= collection.amount && !currentProgress.completed) {
                    // Complete collection and give reward
                    await this.#completeCollection(player, collection, progress);
                    updated = true;
                } else if (totalCount !== currentProgress.amount) {
                    // Update progress
                    progress[collection.id] = {
                        amount: totalCount,
                        completed: false
                    };
                    updated = true;
                }
            }

            if (updated) {
                await this.#savePlayerProgress(player, progress);
            }

            return progress;
        } catch (error) {
            Logger.log(`Error checking collection progress: ${error}`, "ERROR", "COLLECTIONS");
            return this.#getPlayerProgress(player);
        }
    }


    static async getPlayerProgress(player) {
        try {
            const progress = world.getDynamicProperty(`progress_${player.id}`);
            return progress ? JSON.parse(progress) : {};
        } catch (error) {
            Logger.log(`Error getting player progress: ${error}`, "ERROR", "COLLECTIONS");
            return {};
        }
    }

    
    static async getCollectionProgress(player, collectionId) {
        try {
            const progress = world.getDynamicProperty(`progress_${player.id}`);
            if (!progress) return null;
            const playerProgress = JSON.parse(progress);
            return playerProgress[collectionId];
        } catch (error) {
            Logger.log(`Error getting collection progress: ${error}`, "ERROR", "COLLECTIONS");
            return null;
        }
    }

    static async checkSingleCollection(player, collection) {
        try {
            const container = player.getComponent('inventory').container;
            const progress = await this.#getPlayerProgress(player);
            
            if (progress[collection.id]?.completed) return false;

            let totalCount = 0;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item?.typeId === collection.itemId) {
                    totalCount += item.amount;
                }
            }

            const currentProgress = progress[collection.id] || { amount: 0, completed: false };
            if (totalCount >= collection.amount && !currentProgress.completed) {
                await this.#completeCollection(player, collection, progress);
                return true;
            } else if (totalCount !== currentProgress.amount) {
                progress[collection.id] = {
                    amount: totalCount,
                    completed: false
                };
                await this.#savePlayerProgress(player, progress);
                return true;
            }

            return false;
        } catch (error) {
            Logger.log(`Error checking single collection: ${error}`, "ERROR", "COLLECTIONS");
            return false;
        }
    }

    static async #completeCollection(player, collection, progress) {
        try {
            // Mark as completed
            progress[collection.id] = {
                amount: collection.amount,
                completed: true,
                completedAt: Date.now()
            };

            // Give reward
            await player.runCommandAsync(collection.reward);
            player.sendMessage(`§a§lCollection Complete! §r§a${collection.name}\n§7Reward: §f${collection.rewardText}`);

            Logger.log(`Player ${player.name} completed collection ${collection.id}`, "INFO", "COLLECTIONS");
        } catch (error) {
            Logger.log(`Error completing collection: ${error}`, "ERROR", "COLLECTIONS");
        }
    }

    static #getPlayerProgress(player) {
        try {
            const progress = world.getDynamicProperty(`progress_${player.id}`);
            return progress ? JSON.parse(progress) : {};
        } catch (error) {
            Logger.log(`Error getting player progress: ${error}`, "ERROR", "COLLECTIONS");
            return {};
        }
    }

    static async #savePlayerProgress(player, progress) {
        try {
            world.setDynamicProperty(`progress_${player.id}`, JSON.stringify(progress));
        } catch (error) {
            Logger.log(`Error saving player progress: ${error}`, "ERROR", "COLLECTIONS");
        }
    }

    static async getCollectionProgress(player, collectionId) {
        try {
            const progress = await this.getPlayerProgress(player);
            return progress[collectionId];
        } catch (error) {
            Logger.log(`Error getting collection progress: ${error}`, "ERROR", "COLLECTIONS");
            return null;
        }
    }
}
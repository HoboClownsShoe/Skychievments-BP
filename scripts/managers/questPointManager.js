import { JsonDatabase } from "../database/con-database.js";
import { world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";

export class QuestPointsManager {
    static #database;

    static initialize() {
        try {
            this.#database = new JsonDatabase("skychievments_quest_points");                
            Logger.log("Quest Points system initialized", "DEBUG", "QUEST_POINTS");
            return true;
        } catch (error) {
            Logger.log(`Failed to initialize Quest Points system: ${error}`, "ERROR", "QUEST_POINTS");
            return false;
        }
    }

    static async initializePlayerPoints(player) {
        try {
            if (!this.#database.has(player.id)) {
                await this.#database.set(player.id, {
                    points: 0,
                    lastUpdated: Date.now()
                });
                Logger.log(`Initialized quest points for player ${player.name}`, "DEBUG", "QUEST_POINTS");
            }
            return true;
        } catch (error) {
            Logger.log(`Error initializing player points: ${error}`, "ERROR", "QUEST_POINTS");
            return false;
        }
    }

    static async getPlayerPoints(player) {
        try {
            const data = await this.#database.get(player.id);
            return data ? data.points : 0;
        } catch (error) {
            Logger.log(`Error getting player points: ${error}`, "ERROR", "QUEST_POINTS");
            return 0;
        }
    }

    static async addPoints(player, amount) {
        try {
            if (amount <= 0) return false;

            const currentPoints = await this.getPlayerPoints(player);
            const updatedData = {
                points: currentPoints + amount,
                lastUpdated: Date.now()
            };

            await this.#database.set(player.id, updatedData);
            Logger.log(`Added ${amount} points to player ${player.name}`, "DEBUG", "QUEST_POINTS");
            return true;
        } catch (error) {
            Logger.log(`Error adding points: ${error}`, "ERROR", "QUEST_POINTS");
            return false;
        }
    }

    static async setPoints(player, amount) {
        try {
            if (amount < 0) return false;

            const updatedData = {
                points: amount,
                lastUpdated: Date.now()
            };

            await this.#database.set(player.id, updatedData);
            Logger.log(`Set points for player ${player.name} to ${amount}`, "DEBUG", "QUEST_POINTS");
            return true;
        } catch (error) {
            Logger.log(`Error setting points: ${error}`, "ERROR", "QUEST_POINTS");
            return false;
        }
    }

    static async resetPoints(player) {
        try {
            await this.setPoints(player, 0);
            Logger.log(`Reset points for player ${player.name}`, "DEBUG", "QUEST_POINTS");
            return true;
        } catch (error) {
            Logger.log(`Error resetting points: ${error}`, "ERROR", "QUEST_POINTS");
            return false;
        }
    }
}
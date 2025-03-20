import { world } from "@minecraft/server";
import { Logger } from "../utils/logger";
import { MOBLIST } from "../config/mobsList";

class KillTracker {
    // Create mobCodes mapping from MOBLIST
    static #mobCodes = Object.values(MOBLIST)
        .flatMap(category => category.items)
        .reduce((codes, item) => {
            codes[item.id] = item.mobcode;
            return codes;
        }, {});

    static #KILL_STATS_PREFIX = 'kills_';

    /**
     * Records a mob kill for a player using compressed storage format
     */
    static async updateKillProgress(player, entityType) {
        try {
            // Get the shortened code for the mob type
            const mobCode = this.#mobCodes[entityType];
            if (!mobCode) {
                Logger.log(`Unknown mob type: ${entityType}`, "WARN", "KILL_TRACKER");
                return;
            }

            // Get current kill stats
            const propertyKey = this.#KILL_STATS_PREFIX + player.id;
            const currentStats = world.getDynamicProperty(propertyKey) || '';
            
            // Parse existing stats
            const stats = this.#parseKillStats(currentStats);
            
            // Increment kill count
            stats[mobCode] = (stats[mobCode] || 0) + 1;
            
            // Convert back to storage format
            const updatedStats = this.#formatKillStats(stats);
            
            // Save updated stats
            world.setDynamicProperty(propertyKey, updatedStats);
            
            Logger.log(`Updated kill count for player ${player.name}: ${entityType} (${mobCode})`, "DEBUG", "KILL_TRACKER");
        } catch (error) {
            Logger.log(`Error updating kill progress: ${error}`, "ERROR", "KILL_TRACKER");
        }
    }

    /**
     * Parse kill stats from storage format to object
     * Format: "code:count,code:count" -> { code: count }
     */
    static #parseKillStats(statsString) {
        const stats = {};
        if (!statsString) return stats;

        statsString.split(',').forEach(stat => {
            if (!stat) return;
            const [code, count] = stat.split(':');
            if (code && count) {
                stats[code] = parseInt(count);
            }
        });

        return stats;
    }

    /**
     * Format kill stats object to storage format
     * Format: { code: count } -> "code:count,code:count"
     */
    static #formatKillStats(stats) {
        return Object.entries(stats)
            .map(([code, count]) => `${code}:${count}`)
            .join(',');
    }

    /**
     * Get mob code from full entity type
     */
    static getMobCode(entityType) {
        return this.#mobCodes[entityType] || null;
    }

    /**
     * Get full entity type from mob code
     */
    static getFullMobType(mobCode) {
        return Object.entries(this.#mobCodes)
            .find(([_, code]) => code === mobCode)?.[0] || null;
    }
}

export { KillTracker };
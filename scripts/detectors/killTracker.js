import { world } from "@minecraft/server";
import { Logger } from "../utils/logger";

class KillTracker {
    // Mapping of full mob IDs to shorthand codes
    static #mobCodes = {
        // Hostile Mobs
        'minecraft:blaze': 'bz',
        'minecraft:creeper': 'cr',
        'minecraft:drowned': 'dr',
        'minecraft:elder_guardian': 'eg',
        'minecraft:enderman': 'en',
        'minecraft:endermite': 'em',
        'minecraft:ender_dragon': 'ed',
        'minecraft:evoker': 'ev',
        'minecraft:ghast': 'gh',
        'minecraft:guardian': 'gd',
        'minecraft:hoglin': 'hg',
        'minecraft:husk': 'hu',
        'minecraft:magma_cube': 'mc',
        'minecraft:phantom': 'ph',
        'minecraft:piglin': 'pg',
        'minecraft:piglin_brute': 'pb',
        'minecraft:pillager': 'pl',
        'minecraft:ravager': 'rv',
        'minecraft:shulker': 'sh',
        'minecraft:silverfish': 'sf',
        'minecraft:skeleton': 'sk',
        'minecraft:slime': 'sl',
        'minecraft:spider': 'sp',
        'minecraft:stray': 'st',
        'minecraft:vex': 'vx',
        'minecraft:vindicator': 'vd',
        'minecraft:witch': 'wt',
        'minecraft:wither': 'wr',
        'minecraft:wither_skeleton': 'ws',
        'minecraft:zoglin': 'zg',
        'minecraft:zombie': 'zm',
        'minecraft:zombie_villager': 'zv',
        'minecraft:zombified_piglin': 'zp',

        // Passive Mobs
        'minecraft:axolotl': 'ax',
        'minecraft:bat': 'bt',
        'minecraft:bee': 'be',
        'minecraft:cat': 'ct',
        'minecraft:chicken': 'ch',
        'minecraft:cod': 'cd',
        'minecraft:cow': 'cw',
        'minecraft:dolphin': 'dp',
        'minecraft:donkey': 'dk',
        'minecraft:fox': 'fx',
        'minecraft:frog': 'fr',
        'minecraft:goat': 'gt',
        'minecraft:horse': 'hr',
        'minecraft:llama': 'll',
        'minecraft:mooshroom': 'mr',
        'minecraft:mule': 'ml',
        'minecraft:ocelot': 'oc',
        'minecraft:panda': 'pd',
        'minecraft:parrot': 'pt',
        'minecraft:pig': 'pi',
        'minecraft:polar_bear': 'pb',
        'minecraft:pufferfish': 'pf',
        'minecraft:rabbit': 'rb',
        'minecraft:salmon': 'sm',
        'minecraft:sheep': 'sh',
        'minecraft:squid': 'sq',
        'minecraft:strider': 'sr',
        'minecraft:tropical_fish': 'tf',
        'minecraft:turtle': 'tu',
        'minecraft:villager': 'vl',
        'minecraft:wandering_trader': 'wt',
        'minecraft:wolf': 'wf'
    };

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
import { JsonDatabase } from "../database/con-database.js";
import { Logger } from "../utils/logger.js";
import { system } from "@minecraft/server";
import { itemDatabase } from "./itemManager.js";


// This will hold all player statistics instances
const playerStatsMap = new Map();

class StatisticsManager {
    static initialize() {
        try {
            Logger.log("Initializing Statistics Manager", "DEBUG", "STATISTICS");
            return true;
        } catch (error) {
            Logger.log(`Failed to initialize Statistics Manager: ${error}`, "ERROR", "STATISTICS");
            return false;
        }
    }

    static getPlayerStats(player) {
        if (!playerStatsMap.has(player)) {
            const stats = new PlayerStatistics(player);
            playerStatsMap.set(player, stats);
            Logger.log(`Created new statistics instance for ${player.name}`, "DEBUG", "STATISTICS");
        }
    //    Logger.log(`Getting player stats for ${player.name}`, "DEBUG", "STATISTICS");
        return playerStatsMap.get(player);
    }

    static removePlayerStats(player) {
        Logger.log(`Removing player stats for ${player.name}`, "DEBUG", "STATISTICS");
        playerStatsMap.delete(player);
    }

    static clearAllStats() {
        Logger.log(`Clearing all player stats`, "DEBUG", "STATISTICS");
        playerStatsMap.clear();
    }

    // In StatisticsManager.js
    static getAllStatDatabases() {
        try {
            // Get all the stat types and their databases
            const statTypes = [
                'QAE:custom',
                'QAE:placed',
                'QAE:mined',
                'QAE:killed',
                'QAE:killed_by'
            ];
            
            const allStats = new Map();
            
            // For each stat type, create a database and get its contents
            for (const typeId of statTypes) {
                const dbName = `skychievments_stats_${typeId.replace(':', '_')}`;
                const db = new JsonDatabase(dbName);
                
                // Each database contains player stats organized by player ID
                if (db.size > 0) {
                    allStats.set(typeId, Object.fromEntries(db));
                }
            }
            
            return allStats;
        } catch (error) {
            Logger.log(`Error getting all stat databases: ${error}`, "ERROR", "STATISTICS_MANAGER");
            return new Map();
        }
    }

    /**
     * Gets statistics tracker for category-based queries
     * @returns {CategoryStatistics} Category statistics handler
     */
    static getCategoryStats(player) {
        return new CategoryStatistics(this.getPlayerStats(player));
    }
}

class CategoryStatistics {
    #blockDb;
    #playerStats;
    
    constructor(stats) {
        this.#blockDb = itemDatabase.getInstance();
        this.#playerStats = stats;
    }

    /**
     * Gets total count for blocks in a specific category
     * @param {string} category - Category to check
     * @returns {number} Total count for category
     */
    getTotalForCategory(category) {
        try {
            const blocksInCategory = this.#blockDb.getBlocksByCategory(category);
            let total = 0;
            
            for (const blockData of Object.values(blocksInCategory)) {
                const blockId = blockData.id;
                const minedCount = this.#playerStats.blockMined.getBlockType(blockId);
                total += minedCount;
            }
            
            return total;
        } catch (error) {
            Logger.log(`Error getting total for category ${category}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
    }

    /**
     * Checks if the player has interacted with all blocks in a category
     * @param {string} category - Category to check
     * @returns {boolean} True if all blocks in category have been interacted with
     */
    hasAllInCategory(category) {
        try {
            const blocksInCategory = this.#blockDb.getBlocksByCategory(category);
            
            for (const blockData of Object.values(blocksInCategory)) {
                const blockId = blockData.id;
                const minedCount = this.#playerStats.blockMined.getBlockType(blockId);
                if (!minedCount || minedCount <= 0) {
                    return 0;
                }
            }
            
            return 1;
        } catch (error) {
            Logger.log(`Error checking all in category ${category}: ${error}`, "ERROR", "STATISTICS");
            return false;
        }
    }

    /**
     * Gets detailed statistics for blocks in a category
     * @param {string} category - Category to check
     * @returns {Object} Detailed statistics with counts and metadata
     */
    getDetailsForCategory(category) {
        try {
            const blocksInCategory = this.#blockDb.getBlocksByCategory(category);
            const details = {};
            
            for (const [blockId, blockData] of Object.entries(blocksInCategory)) {
                details[blockId] = {
                    count: this.#playerStats.blockMined.getBlockType(blockId),
                    metadata: blockData
                };
            }
            
            return details;
        } catch (error) {
            Logger.log(`Error getting category details for ${category}: ${error}`, "ERROR", "STATISTICS");
            return {};
        }
    }
}


var PlayerStatistics = class {
    constructor(player) {
        this.player = player;
        this.custom = new CustomStatistics(this.player);
        this.blockMined = new MinedStatistics(this.player);
        this.blockPlaced = new PlacedStatistics(this.player);
        this.entityKilled = new KilledStatistics(this.player);
        this.entityKilledBy = new KilledByStatistics(this.player);
    }
};


var Statistics = class {
    static #databases = new Map();
    constructor(player, typeId) {
        this.player = player;
        this.typeId = typeId;

        // Initialize database for this statistic type if not already done
        if (!Statistics.#databases.has(typeId)) {
            // Create database with consistent naming convention
            const dbName = `skychievments_stats_${typeId.replace(':', '_')}`;
            Statistics.#databases.set(typeId, new JsonDatabase(dbName));
            Logger.log(`Created database for ${typeId} statistics`, "DEBUG", "STATISTICS");
        }
    }

    setStatistic(statistic, value) {
        // if (typeof value !== "number") 
        //     throw new TypeError("Statistic value must be a number");
        // this.player.setDynamicProperty(this.typeId + "/" + statistic, value);
        try {
            if (typeof value !== "number") {
                throw new TypeError("Statistic value must be a number");
            }
            const stats = this.getPlayerStats();
            stats[statistic] = value;
            Logger.log(`Setting statistic ${statistic} to ${value}`, "DEBUG", "STATISTICS");

            this.savePlayerStats(stats);
        } catch (error) {
            Logger.log(`Error setting statistic ${statistic}: ${error}`, "ERROR", "STATISTICS");
        }
    }

    getStatistic(statistic) {
        if (statistic === "minecraft:total_world_time" /* totalWorldTime */) {
            return system.currentTick;
        };
        try {
            const stats = this.getPlayerStats();
            let value = stats[statistic] || 0;
            Logger.log(`Getting statistic ${statistic}: ${value}`, "DEBUG", "STATISTICS");

            return value;
        } catch (error) {
            Logger.log(`Error getting statistic ${statistic}: ${error}`, "ERROR", "STATISTICS");
            return 0;
        }
        // const value = this.player.getDynamicProperty(this.typeId + "/" + statistic);
        // if (typeof value === "number") return value;
        // else return 0;
    }

    addStatistic(statistic, value = 1) {
        // if (typeof value !== "number") throw new TypeError("Statistic value must be a number");
        // const previousValue = this.getStatistic(statistic);
        // this.setStatistic(statistic, previousValue + value);
        try {
            if (typeof value !== "number") {
                throw new TypeError("Statistic value must be a number");
            }
            const currentValue = this.getStatistic(statistic);
            this.setStatistic(statistic, currentValue + value);
            Logger.log(`Adding to statistic ${statistic}: ${value}`, "DEBUG", "STATISTICS");

        } catch (error) {
            Logger.log(`Error adding to statistic ${statistic}: ${error}`, "ERROR", "STATISTICS");
        }
    }

    // Database access methods
    getPlayerStats() {
        try {
            const db = Statistics.#databases.get(this.typeId);
            let stats = db.get(this.player.id) || {};
         //   Logger.log(`Getting player stats for ${this.player.name}`, "DEBUG", "STATISTICS");

            return stats;
        } catch (error) {
            Logger.log(`Error getting player stats: ${error}`, "ERROR", "STATISTICS");
            return {};
        }
    }

    savePlayerStats(stats) {
        try {
            const db = Statistics.#databases.get(this.typeId);            
            db.set(this.player.id, stats);
            Logger.log(`Saving player stats for ${this.player.name}`, "DEBUG", "STATISTICS");
        } catch (error) {
            Logger.log(`Error saving player stats: ${error}`, "ERROR", "STATISTICS");
        }
    }

    // Helper methods
    getAllStatistics() {
        Logger.log(`Getting all player stats`, "DEBUG", "STATISTICS");
        return this.getPlayerStats();
    }

    getStatisticTypes() {
        Logger.log(`Getting all statistic types`, "DEBUG", "STATISTICS");
        return Object.keys(this.getPlayerStats());
    }

    getTotalValue() {
        const stats = this.getPlayerStats();
        let total = Object.values(stats).reduce((total, count) => total + count, 0);

        Logger.log(`Getting total value`, "DEBUG", "STATISTICS");

        return total;
    }

    clearStatistics() {
        Logger.log(`Clearing player stats for ${this.player.name}`, "DEBUG", "STATISTICS");
        const db = Statistics.#databases.get(this.typeId);
        db.delete(this.player.id);
    }

    // Migration helper
    async migrateFromDynamicProperties(prefix) {
        try {
            const properties = this.player.getDynamicPropertyIds();
            const relevantProperties = properties.filter(p => p.startsWith(prefix));

            const stats = {};
            for (const property of relevantProperties) {
                const statName = property.substring(prefix.length);
                const value = this.player.getDynamicProperty(property);
                if (value > 0) {
                    stats[statName] = value;
                }
                // Clean up old property
                this.player.getDynamicProperty(property);
            }

            if (Object.keys(stats).length > 0) {
                this.savePlayerStats(stats);
                Logger.log(
                    `Migrated ${this.typeId} stats for ${this.player.name}`,
                    "DEBUG",
                    "STATISTICS"
                );
            }

            return true;
        } catch (error) {
            Logger.log(`Error migrating stats: ${error}`, "ERROR", "STATISTICS");
            return false;
        }
    }
};

var CustomStatistics = class extends Statistics {
    constructor(player) {
      super(player, "QAE:custom" /* CUSTOM */);
      this.player = player;
    }
    incrementStat(statName) {
        this.addStatistic(statName);
    }

    getCustomStat(statName) {
        return this.getStatistic(statName);
    }
};

var PlacedStatistics = class extends Statistics {
    constructor(player) {
        super(player, "QAE:placed" /* BLOCK_PLACED */);
        this.player = player;
    }
    addBlockType(blockType) {
        // Ensure we're using just the block ID string
        const blockId = typeof blockType === 'object' ? blockType.id : blockType;
        this.addStatistic(blockId);
        Logger.log(`Adding placed block type stats for ${blockId}`, "DEBUG", "STATISTICS");
    }

    getBlockType(blockType) {
        // Ensure we're using just the block ID string
        const blockId = typeof blockType === 'object' ? blockType.id : blockType;
        let value = this.getStatistic(blockId);
        
        // Add debug logging
        Logger.log(`Getting placed block type stats for ${blockId}: ${value}`, "DEBUG", "STATISTICS");        
        return value;
    }

    getTotalBlocksPlaced() {
        Logger.log(`Getting all blocks placed count`, "DEBUG", "STATISTICS");
        return this.getTotalValue();
    }

    getPlacedBlockTypes() {
        Logger.log(`Getting all blocks placed types`, "DEBUG", "STATISTICS");
        return this.getStatisticTypes();
    }

};

var MinedStatistics = class extends Statistics {
    constructor(player) {
        super(player, "QAE:mined" /* BLOCK_MINED */);
        this.player = player;
    }
    addBlockType(blockType) {
        // Ensure we're using just the block ID string
        const blockId = typeof blockType === 'object' ? blockType.id : blockType;
        this.addStatistic(blockId);
        Logger.log(`Adding block type stats for ${blockId}`, "DEBUG", "STATISTICS");
    }

    getBlockType(blockType) {
        // Ensure we're using just the block ID string
        const blockId = typeof blockType === 'object' ? blockType.id : blockType;
        let value = this.getStatistic(blockId);
        
        // Add debug logging
        Logger.log(`Getting block type stats for ${blockId}: ${value}`, "DEBUG", "STATISTICS");        
        return value;
    }

    getTotalBlocksMined() {
        Logger.log(`Getting all blocks count`, "DEBUG", "STATISTICS");
        return this.getTotalValue();
    }

    getMinedBlockTypes() {
        Logger.log(`Getting all block types`, "DEBUG", "STATISTICS");
        return this.getStatisticTypes();
    }

};

var KilledStatistics = class extends Statistics {
    constructor(player) {
        super(player, "QAE:killed" /* ENTITY_KILLED */);
        this.player = player;
    }
    addEntity(entity) {            
        this.addStatistic(entity.typeId);
        Logger.log(`Adding killed stats for ${entity.typeId}`, "DEBUG", "STATISTICS");
        
    }    
    getKillCount(entityType) {
        const entityId = typeof entityType === 'object' ? entityType.id : entityType;
        let value = this.getStatistic(entityId);
        
        Logger.log(`Getting killed stats for ${entityId}: ${value}`, "DEBUG", "STATISTICS");
        return value;       
    }
    getTotalKills() {
        Logger.log(`Getting total kill counts`, "DEBUG", "STATISTICS");
        return this.getTotalValue();
    }
};

var KilledByStatistics = class extends Statistics {
    constructor(player) {
        super(player, "QAE:killed_by" /* ENTITY_KILLED_BY */);
        this.player = player;
    }
    addEntity(entity) {
        this.addStatistic(entity.typeId);
    }
    getDeathCount(entityType) {
        return this.getStatistic(entityType);
    }
    getTotalDeaths() {
        return this.getTotalValue();
    }
};

// Your existing Statistics classes go here...
// (CustomStatistics, MinedStatistics, KilledStatistics, KilledByStatistics)

export { StatisticsManager, PlayerStatistics };
import { JsonDatabase } from "../database/con-database.js";
import { Logger } from "../utils/logger.js";
import { itemsData, entitiesData } from "../config/qaeItems.js";


export class itemDatabase {
    static #instance;
    #itemDb;
    #entitiesDb;

    constructor() {
        this.#itemDb = new JsonDatabase('qae_blocks_data');
        this.#entitiesDb = new JsonDatabase('qae_entity_data');
        this.initialize();
    }

    static getInstance() {
        if (!itemDatabase.#instance) {
            itemDatabase.#instance = new itemDatabase();
        }
        return itemDatabase.#instance;
    }

    initialize() {
        try {
            // Clear existing data to ensure clean initialization
            this.initializeBlocks();
            this.initializeEntities();
            
            Logger.log(`Initialized QAE Things databases`, "INFO", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error initializing items database: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    initializeBlocks() {
        try {
            this.#itemDb.clear();
            // Load all blocks from config
            for (const itemData of itemsData) {
                this.addData(itemData.id, {
                    itemId: itemData.itemId,
                    categories: itemData.categories,
                    icon: itemData.icon,
                    displayName: itemData.displayName
                });
            }   
            Logger.log(`Initialized item databases with ${this.#itemDb.size} items`, "INFO", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error initializing items database: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    initializeEntities() {
        try {
            this.#entitiesDb.clear();

            // Load all entities from config
            for (const entityData of entitiesData) {
                this.addEntity(entityData.id, {
                    itemId: entityData.itemId,
                    categories: entityData.categories,
                    icon: entityData.icon,
                    displayName: entityData.displayName
                });
            }
            Logger.log(`Initialized Entity database with ${this.#entitiesDb.size} items`, "INFO", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error initializing items database: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    addData(itemId, data) {
        try {
            this.#itemDb.set(itemId, {
                id: itemId,
                itemId: data.itemId || 0,
                categories: data.categories || [],
                icon: data.icon || '',
                displayName: data.displayName || itemId
            });
            Logger.log(`Added item data for ${itemId}`, "DEBUG", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error adding item data for ${itemId}: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    addEntity(itemId, data) {
        try {
            this.#entitiesDb.set(itemId, {
                id: itemId,
                itemId: data.itemId || 0,
                categories: data.categories || [],
                icon: data.icon || '',
                displayName: data.displayName || itemId
            });
            Logger.log(`Added item data for ${itemId}`, "DEBUG", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error adding item data for ${itemId}: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    /**
     * Reloads the block database from config
     * Useful for refreshing data after config updates
     */
    reloadFromConfig() {
        try {
            this.initialize();
            Logger.log("Successfully reloaded item database from config", "INFO", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error reloading item database: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    getBlock(itemId) {
        return this.#itemDb.get(itemId);
    }

    getEntity(itemId) {
        return this.#entitiesDb.get(itemId);
    }

    getBlocksByCategory(category) {
        try {
            Logger.log(`Category : ${category}`, "DEBUG", "ITEM_DATABASE" );
            const items = {};
            for (const [itemId, data] of this.#itemDb) {
                if (data.categories.includes(category)) {
                    items[itemId] = data;
                    Logger.log(`Category : ${category}, added : ${data.displayName}`, "DEBUG", "ITEM_DATABASE" );
                }
            }
            return items;
        } catch (error) {
            Logger.log(`Error getting item by category ${category}: ${error}`, "ERROR", "ITEM_DATABASE");
            return {};
        }
    }

    getEntitiesByCategory(category) {
        try {
            const entities = {};
            for (const [itemId, data] of this.#entitiesDb) {
                if (data.categories.includes(category)) {
                    entities[itemId] = data;
                }
            }
            return entities;
        } catch (error) {
            Logger.log(`Error getting item by category ${category}: ${error}`, "ERROR", "ITEM_DATABASE");
            return {};
        }
    }

    getAllBlockCategories() {
        try {
            const categories = new Set();
            for (const [, data] of this.#itemDb) {
                data.categories.forEach(cat => categories.add(cat));
            }
            return Array.from(categories);
        } catch (error) {
            Logger.log(`Error getting all block categories: ${error}`, "ERROR", "ITEM_DATABASE");
            return [];
        }
    }

    getAllEntityCategories() {
        try {
            const categories = new Set();
            for (const [, data] of this.#entitiesDb) {
                data.categories.forEach(cat => categories.add(cat));
            }
            return Array.from(categories);
        } catch (error) {
            Logger.log(`Error getting all entity categories: ${error}`, "ERROR", "ITEM_DATABASE");
            return [];
        }
    }
};

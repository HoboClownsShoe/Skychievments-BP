import { JsonDatabase } from "../database/con-database.js";
import { Logger } from "../utils/logger.js";
import { itemsData } from "../config/qaeItems.js";

export class itemDatabase {
    static #instance;
    #itemDb;

    constructor() {
        this.#itemDb = new JsonDatabase('que_items_data');
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
            this.#itemDb.clear();
            
            // Load all blocks from config
            for (const itemData of itemsData) {
                this.addBlock(itemData.id, {
                    itemId: itemData.itemId,
                    categories: itemData.categories,
                    icon: itemData.icon,
                    displayName: itemData.displayName
                });
            }
            
            Logger.log(`Initialized item database with ${this.#itemDb.size} items`, "INFO", "ITEM_DATABASE");
        } catch (error) {
            Logger.log(`Error initializing items database: ${error}`, "ERROR", "ITEM_DATABASE");
        }
    }

    addBlock(itemId, data) {
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

    getBlocksByCategory(category) {
        try {
            const items = {};
            for (const [itemId, data] of this.#itemDb) {
                if (data.categories.includes(category)) {
                    items[itemId] = data;
                }
            }
            return items;
        } catch (error) {
            Logger.log(`Error getting item by category ${category}: ${error}`, "ERROR", "ITEM_DATABASE");
            return {};
        }
    }

    getAllCategories() {
        try {
            const categories = new Set();
            for (const [, data] of this.#itemDb) {
                data.categories.forEach(cat => categories.add(cat));
            }
            return Array.from(categories);
        } catch (error) {
            Logger.log(`Error getting all categories: ${error}`, "ERROR", "ITEM_DATABASE");
            return [];
        }
    }
};

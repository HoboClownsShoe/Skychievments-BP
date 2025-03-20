// utils/databaseManager.js
import { JsonDatabase } from '../database/con-database.js';
import { world } from '@minecraft/server';
import { Logger } from '../utils/logger.js';


export class DatabaseManager {
    static #instances = new Map();
    static #managers = new Map();

    /**
     * Registers a database with its managing class
     */
    static registerDatabase(dbName, managerClass) {
        this.#managers.set(dbName, managerClass);
        Logger.log(`Registered database: ${dbName} with manager: ${managerClass.name}`, "DEBUG", "DATABASE");
    }

    static getDatabase(name) {
        // Check for existing valid instance
        if (this.#instances.has(name)) {
            const db = this.#instances.get(name);
            if (db.isValid() ) {
                return db;
            }
            // Remove invalid instance
            this.#instances.delete(name);
        }
        
        // Create new instance
        const db = new JsonDatabase(name);
        this.#instances.set(name, db);
        return db;
    }

    /**
     * Gets all registered databases and their managers
     */
    static getRegisteredDatabases() {
        return Array.from(this.#managers.entries()).map(([dbName, manager]) => ({
            name: dbName,
            manager: manager.name
        }));
    }


    static disposeDatabase(name) {
        if (this.#instances.has(name)) {
            const db = this.#instances.get(name);            
            this.#instances.delete(name);
            return true;
        }
        return false;
    }

    static disposeAll() {
        for (const [name, db] of this.#instances) {
                db.dispose(); // Proper disposal of database
                   
                console.warn(db.size);
        }
        this.#instances.clear();
    }

    static validateAll() {
        const invalid = [];
        for (const [name, db] of this.#instances) {
            if (!db.isValid() || db.isDisposed) {
                invalid.push(name);
            }
        }
        return invalid;
    }

    /**
     * Reinitializes all registered managers
     */
    static async reinitializeAll() {
        const results = {
            success: [],
            failed: []
        };

        for (const [dbName, managerClass] of this.#managers) {
            try {
                await managerClass.initialize();
                console.warn(dbName.size);
                results.success.push(dbName);
            } catch (error) {
                results.failed.push({ dbName, error });
            }
        }

        return results;
    }
}
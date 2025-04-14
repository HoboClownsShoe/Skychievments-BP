import { world } from '@minecraft/server';
import { JsonDatabase } from '../database/con-database.js';
import { Permissions } from './permissions.js';

export class Logger {
    static #logDB;    
    static #GLOBAL_DEBUG = false; // Renamed for clarity
    static #COMPONENT_DEBUG = {}; // Stores component-specific debug flags
    static #MAX_GROUP_LOGS = 100;
    static #SETTINGS_KEY = "logger_settings"; // Centralized key for settings

    static initialize() {
        try {
            this.#logDB = new JsonDatabase("skychievments_logger");
            // Load all settings at once
            const settings = this.#logDB.get(this.#SETTINGS_KEY) || {};
            this.#GLOBAL_DEBUG = settings.globalDebug ?? false; // Use ?? for default
            this.#COMPONENT_DEBUG = settings.componentDebug ?? {}; // Use ?? for default
            
            // Use internal log method to respect initial debug state
            this.#internalLog("Logger system initialized", "DEBUG", "LOGGER"); 
            return true;           
        } catch (error) {
            // Use console.warn directly here as logger might not be ready
            console.warn(`Failed to initialize logger state: ${error}`);
            return false;
        }
    }

    // Internal log function used by initialize before full setup might be complete
    static #internalLog(message, type = 'INFO', component = 'GENERAL', groupId = null) {
        const timestamp = new Date().toISOString();
        const groupInfo = groupId ? `[${groupId}] ` : '';
        const formattedMessage = `[${timestamp}] [${type}] [${component}] ${groupInfo}${message}`;
        console.warn(formattedMessage);
    }

    static log(message, type = 'INFO', component = 'GENERAL', groupId = null) {
        // Determine if this message should be logged based on debug flags
        const isDebugMessage = type === 'DEBUG';
        const isComponentDebugEnabled = this.#COMPONENT_DEBUG[component] === true;
        
        // Skip DEBUG messages if neither global nor component debug is enabled
        if (isDebugMessage && !this.#GLOBAL_DEBUG && !isComponentDebugEnabled) {
            return; 
        }
        
        const timestamp = new Date().toISOString();
        const groupInfo = groupId ? `[${groupId}] ` : '';
        const formattedMessage = `[${timestamp}] [${type}] [${component}] ${groupInfo}${message}`;
        
        console.warn(formattedMessage);
        
        // Store logs if database is valid
        if (this.isValid()) {
            this.#storeLog({
                timestamp,
                type,
                component,
                groupId,
                message
            });
            
            // Store group-specific logs if groupId provided and valid
            if (groupId) { // Simplified check for example
                this.#storeGroupLog(groupId, {
                    timestamp,
                    type,
                    component,
                    message
                });
            }
        }
        
        // Send error messages to admins
        if (type === 'ERROR') {
            for (const player of world.getAllPlayers()) {
                if (Permissions.isAdmin(player)) { // Simplified check for example
                    player.sendMessage(`§c${formattedMessage}`);
                }
            }
        }
    }

    static #storeLog(logEntry) {
        try {
            const logs = this.#logDB.get('general_logs') || [];
            logs.push(logEntry);

            // Keep only recent logs
            if (logs.length > this.#MAX_GROUP_LOGS) {
                logs.splice(0, logs.length - this.#MAX_GROUP_LOGS);
            }

            this.#logDB.set('general_logs', logs);
        } catch (error) {
            console.warn(`Failed to store log: ${error}`);
        }
    }

    static #storeGroupLog(groupId, logEntry) {
        try {
            const groupLogs = this.#logDB.get(`group_${groupId}_logs`) || [];
            groupLogs.push(logEntry);

            // Keep only recent logs
            if (groupLogs.length > this.#MAX_GROUP_LOGS) {
                groupLogs.splice(0, groupLogs.length - this.#MAX_GROUP_LOGS);
            }

            this.#logDB.set(`group_${groupId}_logs`, groupLogs);
        } catch (error) {
            console.warn(`Failed to store group log: ${error}`);
        }
    }

    static getGroupLogs(groupId) {
        try {
            return this.#logDB.get(`group_${groupId}_logs`) || [];
        } catch (error) {
            console.warn(`Failed to get group logs: ${error}`);
            return [];
        }
    }

    static getAllLogs() {
        try {
            return this.#logDB.get('general_logs') || [];
        } catch (error) {
            console.warn(`Failed to get logs: ${error}`);
            return [];
        }
    }

    static clearGroupLogs(groupId) {
        try {
            this.#logDB.delete(`group_${groupId}_logs`);
            return true;
        } catch (error) {
            console.warn(`Failed to clear group logs: ${error}`);
            return false;
        }
    }

    static clearAllLogs() {
        try {
            // Keep settings but clear all logs
            const settings = this.#logDB.get(this.#SETTINGS_KEY);
            this.#logDB.clear(); // Clears the entire database
            if (settings) {
                // Restore settings after clearing
                this.#logDB.set(this.#SETTINGS_KEY, settings); 
            }
            this.log("All logs cleared", "INFO", "LOGGER");
            return true;
        } catch (error) {
            console.warn(`Failed to clear logs: ${error}`);
            return false;
        }
    }
    
    // --- Debug Control Methods ---

    static #saveSettings() {
        try {
            if (this.isValid()) {
                const settings = {
                    globalDebug: this.#GLOBAL_DEBUG,
                    componentDebug: this.#COMPONENT_DEBUG
                };
                this.#logDB.set(this.#SETTINGS_KEY, settings);
            }
        } catch (error) {
             console.warn(`Failed to save logger settings: ${error}`);
        }
    }

    static toggleGlobalDebug() {
        try {
            this.#GLOBAL_DEBUG = !this.#GLOBAL_DEBUG;
            this.#saveSettings(); // Save changes
            this.log(`Global debug ${this.#GLOBAL_DEBUG ? 'enabled' : 'disabled'}`, "INFO", "LOGGER");
            return this.#GLOBAL_DEBUG;
        } catch (error) {
            console.warn(`Failed to toggle global debug mode: ${error}`);
            return this.#GLOBAL_DEBUG; // Return current state even on error
        }
    }
    
    static enableComponentDebug(component) {
        if (!component) return false;
        try {
            this.#COMPONENT_DEBUG[component] = true;
            this.#saveSettings(); // Save changes
            this.log(`Debug enabled for component: ${component}`, "INFO", "LOGGER");
            return true;
        } catch (error) {
            console.warn(`Failed to enable debug for component ${component}: ${error}`);
            return false;
        }
    }

    static disableComponentDebug(component) {
         if (!component) return false;
        try {
            // Using delete is slightly cleaner than setting to false if it doesn't exist
            delete this.#COMPONENT_DEBUG[component]; 
            this.#saveSettings(); // Save changes
            this.log(`Debug disabled for component: ${component}`, "INFO", "LOGGER");
            return true;
        } catch (error) {
            console.warn(`Failed to disable debug for component ${component}: ${error}`);
            return false;
        }
    }

    static isGlobalDebugEnabled() {
        return this.#GLOBAL_DEBUG;
    }

    static isComponentDebugEnabled(component) {
        return this.#COMPONENT_DEBUG[component] === true;
    }
    
    static getDebugSettings() {
        // Return a copy to prevent external modification
        return {
            global: this.#GLOBAL_DEBUG,
            components: { ...this.#COMPONENT_DEBUG } 
        };
    }

    // --- Utility Methods ---

    static isValid() {
        return this.#logDB && typeof this.#logDB.get === 'function' && typeof this.#logDB.set === 'function';
    }

    static dispose() {
        if (this.#logDB && typeof this.#logDB.dispose === 'function' && !this.#logDB.isDisposed) {
            this.#logDB.dispose();
        }
    }
}
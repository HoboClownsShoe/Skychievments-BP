
import { world } from '@minecraft/server';
import { JsonDatabase } from '../database/con-database.js';
import { Permissions } from './permissions.js';
import { CollectionManager, CollectionStorage, CollectionHandler, CollectionGroupManager } from '../managers/collectionsManager.js';
import { DatabaseManager } from '../managers/databaseManager.js';

export class Logger {
    static #logDB;    
    static #DEBUG = false;
    static #MAX_GROUP_LOGS = 100;

    static initialize() {
        try {
            this.#logDB = new JsonDatabase("skychievments_logger");
            const savedState = this.#logDB.get("debug_state");
            if (savedState !== undefined) {
                this.DEBUG = savedState;
            }
            Logger.log("Logger system initialized", "DEBUG", "LOGGER");
            return true;           
        } catch (error) {
            console.warn(`Failed to initialize logger state: ${error}`);
            return false;
        }
    }

    static log(message, type = 'INFO', component = 'GENERAL', groupId = null) {
        if (!this.#DEBUG && type === 'DEBUG') return;
        
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
            
            // Store group-specific logs if groupId provided
            if (groupId && CollectionGroupManager.isValidGroupId(groupId)) {
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
                if (Permissions.isAdmin(player)) {
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
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                return [];
            }

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
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                return false;
            }

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
            const settings = this.#logDB.get('settings');
            this.#logDB.clear();
            if (settings) {
                this.#logDB.set('settings', settings);
            }
            return true;
        } catch (error) {
            console.warn(`Failed to clear logs: ${error}`);
            return false;
        }
    }

    static toggleDebug() {
        try {
            this.#DEBUG = !this.#DEBUG;
            
            const settings = this.#logDB.get('settings') || {};
            settings.debug = this.#DEBUG;
            this.#logDB.set('settings', settings);
            
            return this.#DEBUG;
        } catch (error) {
            console.warn(`Failed to toggle debug mode: ${error}`);
            return this.#DEBUG;
        }
    }

    static isDebugEnabled() {
        return this.#DEBUG;
    }

    static isValid() {
        return this.#logDB?.isValid() && !this.#logDB?.isDisposed;
    }

    static dispose() {
        if (this.#logDB && !this.#logDB.isDisposed) {
            this.#logDB.dispose();
        }
    }
}
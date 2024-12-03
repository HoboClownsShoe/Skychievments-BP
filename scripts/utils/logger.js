// scripts/utils/logger.js
import { world } from '@minecraft/server';
import { Permissions } from './permissions.js';
import { CollectionGroupManager } from '../config/collectionGroups.js';

export class Logger {
    static DEBUG = false;
    static #STORAGE_KEY = 'sk_logger_debug';
    static #GROUP_LOG_PREFIX = 'group_log_';
    static #MAX_GROUP_LOGS = 100;

    static initialize() {
        try {
            const savedState = world.getDynamicProperty(this.#STORAGE_KEY);
            if (savedState !== undefined) {
                this.DEBUG = savedState === 'true';
            }
        } catch (error) {
            console.warn(`Failed to initialize logger state: ${error}`);
        }
    }

    static log(message, type = 'INFO', component = 'GENERAL', groupId = null) {
        if (!this.DEBUG && type === 'DEBUG') return;
        
        const timestamp = new Date().toISOString();
        const groupInfo = groupId ? `[${groupId}] ` : '';
        const formattedMessage = `[${timestamp}] [${type}] [${component}] ${groupInfo}${message}`;
        
        console.warn(formattedMessage);
        
        // Store group-specific logs if a group ID is provided
        if (groupId && CollectionGroupManager.isValidGroupId(groupId)) {
            this.#storeGroupLog(groupId, {
                timestamp,
                type,
                component,
                message
            });
        }
        
        if (type === 'ERROR') {
            for (const player of world.getAllPlayers()) {
                if (Permissions.isAdmin(player)) {
                    player.sendMessage(`§c${formattedMessage}`);
                }
            }
        }
    }

    static async #storeGroupLog(groupId, logEntry) {
        try {
            const storageKey = `${this.#GROUP_LOG_PREFIX}${groupId}`;
            let logs = world.getDynamicProperty(storageKey);
            logs = logs ? JSON.parse(logs) : [];

            // Add new log entry
            logs.push(logEntry);

            // Keep only the most recent logs
            if (logs.length > this.#MAX_GROUP_LOGS) {
                logs = logs.slice(-this.#MAX_GROUP_LOGS);
            }

            world.setDynamicProperty(storageKey, JSON.stringify(logs));
        } catch (error) {
            console.warn(`Failed to store group log: ${error}`);
        }
    }

    static async getGroupLogs(groupId) {
        try {
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                return [];
            }

            const storageKey = `${this.#GROUP_LOG_PREFIX}${groupId}`;
            const logs = world.getDynamicProperty(storageKey);
            return logs ? JSON.parse(logs) : [];
        } catch (error) {
            console.warn(`Failed to get group logs: ${error}`);
            return [];
        }
    }

    static async clearGroupLogs(groupId) {
        try {
            if (!CollectionGroupManager.isValidGroupId(groupId)) {
                return false;
            }

            const storageKey = `${this.#GROUP_LOG_PREFIX}${groupId}`;
            world.setDynamicProperty(storageKey, null);
            return true;
        } catch (error) {
            console.warn(`Failed to clear group logs: ${error}`);
            return false;
        }
    }

    static toggleDebug() {
        this.DEBUG = !this.DEBUG;
        world.setDynamicProperty(this.#STORAGE_KEY, String(this.DEBUG));
        return this.DEBUG;
    }

    static isDebugEnabled() {
        return this.DEBUG;
    }
}
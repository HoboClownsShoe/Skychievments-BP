// scripts/utils/logger.js
import { world } from '@minecraft/server';
import { Permissions } from './permissions.js';

// In logger.js

export class Logger {
    static DEBUG = false;
    static #STORAGE_KEY = 'sk_logger_debug';

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

    static log(message, type = 'INFO', component = 'GENERAL') {
        if (!this.DEBUG && type === 'DEBUG') return;
        
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${type}] [${component}] ${message}`;
        
        console.warn(formattedMessage);
        
        if (type === 'ERROR') {
            for (const player of world.getAllPlayers()) {
                if (Permissions.isAdmin(player)) {
                    player.sendMessage(`§c${formattedMessage}`);
                }
            }
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
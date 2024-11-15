// scripts/utils/logger.js
import { world } from '@minecraft/server';
import { Permissions } from './permissions.js';

export class Logger {
    static DEBUG = true;

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
}
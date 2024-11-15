
// scripts/index.js
import { world } from '@minecraft/server';
import { AdminMenu } from './ui/adminMenu';
import { PlayerMenu } from './ui/playerMenu';
import { CollectionManager } from './config/collections';
import { Logger } from './utils/logger';
import { Permissions } from './utils/permissions';

world.afterEvents.worldInitialize.subscribe(() => {
    try {
        // Create admin_level objective if it doesn't exist
        if (!world.scoreboard.getObjective('admin_level')) {
            world.scoreboard.addObjective('admin_level', 'Admin Level');
        }
        CollectionManager.loadCollections();


    } catch (error) {
        Logger.log(`Error in initialization: ${error}`, "ERROR", "MAIN");
    }
});

world.afterEvents.itemUse.subscribe((event) => {
    try {
        const { source: player, itemStack } = event;
        
        switch (itemStack.typeId) {
            case 'skyblock:skychievments_admin':
                if (Permissions.isAdmin(player)) {
                    AdminMenu.showMainMenu(player);
                } else {
                    player.sendMessage('§cYou need admin permissions to use this item!');
                }
                break;
                
            case 'skyblock:skychievments':
                PlayerMenu.showMainMenu(player);
                break;
        }
    } catch (error) {
        Logger.log(`Error handling item use: ${error}`, "ERROR", "MAIN");
    }
});

Logger.log("Skychievments UI system initialized", "INFO", "MAIN");



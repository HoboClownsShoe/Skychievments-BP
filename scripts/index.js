
// scripts/index.js
import { world } from '@minecraft/server';
import { AdminMenu } from './ui/adminMenu';
import { PlayerMenu } from './ui/playerMenu';
import { CollectionManager } from './config/collections';
import { Logger } from './utils/logger';
import { Permissions } from './utils/permissions';
import { ActionFormData, MessageFormData } from "@minecraft/server-ui"

world.afterEvents.worldInitialize.subscribe(() => {
    try {
        // Initialize logger first
        Logger.initialize();

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
        

        const ui = new ActionFormData()
        .title("Default")
        .body("")
        .button("button1")
        .button("button2")
        .button("button3", "textures/ui/mining_icon.png");

        const mfd = new MessageFormData()
        .title("MessageFormData")
        .body("erm......")
        .button1("Confirm")
        .button2("Cancel")


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

            case "minecraft:compass": mfd.show(player); 
                break;

        }
    } catch (error) {
        Logger.log(`Error handling item use: ${error}`, "ERROR", "MAIN");
    }
});

Logger.log("Skychievments UI system initialized", "INFO", "MAIN");



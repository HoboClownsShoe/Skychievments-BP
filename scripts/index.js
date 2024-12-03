
// scripts/index.js
import { world } from '@minecraft/server';
import { AdminMenu } from './ui/adminMenu';
import { PlayerMenu } from './ui/playerMenu';
import { CollectionManager } from './config/collections';
import { Logger } from './utils/logger';
import { Permissions } from './utils/permissions';
import { CollectionGroupManager } from './config/collectionGroups';
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

world.afterEvents.worldInitialize.subscribe(async () => {
    try {
        Logger.log("Initializing Skychievments system...", "INFO", "MAIN");

        // Initialize logger first for proper debugging
        Logger.initialize();

        // Create admin_level objective if it doesn't exist
        if (!world.scoreboard.getObjective('admin_level')) {
            world.scoreboard.addObjective('admin_level', 'Admin Level');
            Logger.log("Created admin_level scoreboard objective", "INFO", "MAIN");
        }

        // Load collections for each group
        let loadSuccess = true;
        for (const groupId of CollectionGroupManager.getGroupIds()) {
            const group = CollectionGroupManager.getGroupById(groupId);
            const groupSuccess = await CollectionManager.loadCollections(group.id);
            
            if (!groupSuccess) {
                loadSuccess = false;
                Logger.log(`Failed to load collections for group: ${group.displayName}`, "ERROR", "MAIN");
            }
        }

        if (loadSuccess) {
            Logger.log("All collection groups loaded successfully", "INFO", "MAIN");
        } else {
            Logger.log("Some collection groups failed to load", "ERROR", "MAIN");
        }

        // Display initialization status to online admins
        for (const player of world.getAllPlayers()) {
            if (Permissions.isAdmin(player)) {
                player.sendMessage(
                    loadSuccess ? 
                    "§a§lSkychievments initialized successfully!" :
                    "§c§lWarning: Some Skychievments collections failed to load. Check logs for details."
                );
            }
        }

    } catch (error) {
        Logger.log(`Critical error in initialization: ${error}`, "ERROR", "MAIN");
        
        // Notify admins of critical initialization failure
        for (const player of world.getAllPlayers()) {
            if (Permissions.isAdmin(player)) {
                player.sendMessage("§c§lCritical error initializing Skychievments system. Check logs for details.");
            }
        }
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



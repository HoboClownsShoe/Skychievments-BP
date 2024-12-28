// scripts/index.js
import { world } from '@minecraft/server';
import { AdminMenu } from './ui/adminMenu';
import { PlayerMenu } from './ui/playerMenu';
import { CollectionManager } from './config/collections';
import { Logger } from './utils/logger';
import { Permissions } from './utils/permissions';
import { CollectionGroupManager } from './config/collectionGroups';
import { CollectionStorage } from './utils/collectionStorage';
import { showTipToast } from './utils/toast.js';
import { ChestFormData } from './extensions/forms.js';
import { KillTracker } from "detectors/killTracker.js"
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

// Initialize the system when the world starts
world.afterEvents.worldInitialize.subscribe(async () => {
    try {
        Logger.log("Initializing Skychievments system...", "DEBUG", "MAIN");
        
        // Initialize logger first for proper debugging
        Logger.initialize();

        // Create admin_level objective if it doesn't exist
        if (!world.scoreboard.getObjective('admin_level')) {
            world.scoreboard.addObjective('admin_level', 'Admin Level');
            Logger.log("Created admin_level scoreboard objective", "DEBUG", "MAIN");
        }

        // Initialize storage system
        let initSuccess = true;
        try {
            CollectionStorage.initialize();
            Logger.log("Collection storage system initialized", "DEBUG", "MAIN");
        } catch (storageError) {
            Logger.log(`Failed to initialize storage system: ${storageError}`, "ERROR", "MAIN");
            initSuccess = false;
        }

        // Initialize collection manager and load collections
        if (initSuccess) {
            initSuccess = await CollectionManager.initialize();
            if (!initSuccess) {
                Logger.log("Failed to initialize collection manager", "ERROR", "MAIN");
            }
        }

        // Load collections for each group
        if (initSuccess) {
            for (const groupId of CollectionGroupManager.getGroupIds()) {
                const group = CollectionGroupManager.getGroupById(groupId);
                if (!group) continue;

                try {
                    // Get all collections for this group
                    const groupCollections = CollectionStorage.getCollectionsByGroup(groupId);
                    Logger.log(`Loaded ${groupCollections.length} collections for group: ${group.displayName}`, "DEBUG", "MAIN");
                } catch (groupError) {
                    Logger.log(`Error loading collections for group ${group.displayName}: ${groupError}`, "ERROR", "MAIN");
                    initSuccess = false;
                }
            }
        }

        // Display initialization status to online admins
        for (const player of world.getAllPlayers()) {
            if (Permissions.isAdmin(player)) {
                player.sendMessage(
                    initSuccess ? 
                    "§q§lSkychievments initialized successfully!" :
                    "§c§lWarning: Some Skychievments collections failed to load. Check logs for details."
                );
            }
            if (!Permissions.isAdmin(player)) {
                showTipToast(player, initSuccess ? 'finishInit' : 'failedInit');
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

// Handle item use events for menus
world.afterEvents.itemUse.subscribe((event) => {
    try {
        const { source: player, itemStack } = event;

        const ui = new ActionFormData()
        .title("Default")
        .body("")
        .button("button1")
        .button("button2")
        .button("button3", "textures/ui/mining_icon.png");

        const mfd = new ChestFormData('54')
        .title('Testing')
        .button(6, 'Button Name', ['Lore'], 'minecraft:oak_log', 1 )
        .button(53, 'Testing', ['Lore Lore'], 'minecraft:diamond', 1)
        .button(14, 'Testing', ['Lore Lore'], 'minecraft:jungle_pressure_plate', 1);

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

            case "minecraft:compass": 
                showTipToast(player, 'Hello');
                ui.show(player); 
                break;
        }
    } catch (error) {
        Logger.log(`Error handling item use: ${error}`, "ERROR", "MAIN");
        if (event.source) {
            event.source.sendMessage('§cAn error occurred while opening the menu.');
        }
    }
});

// Handle new player joins
world.afterEvents.playerSpawn.subscribe((event) => {
    try {
        let { initialSpawn, player } = event;
        if (!initialSpawn) return; // If it's not the first spawn, exit method

        player.addTag('skychievments');
        showTipToast(player, 'welcome');
    } catch (error) {
        Logger.log(`Error handling player spawn: ${error}`, "ERROR", "MAIN");
    }
});


// Track mob kills
world.afterEvents.entityDie.subscribe((e) => {
    let { damageSource, deadEntity } = e;

    const damager = damageSource.damagingEntity;
    if (!damager || damager.typeId !== 'minecraft:player') return;

    const damaged = deadEntity.typeId;
    if (!damaged.startsWith('minecraft:')) return;
    if (damaged === 'minecraft:item') return;

    // Update kill progress
    KillTracker.updateKillProgress(damager, damaged);
});

Logger.log("Skychievments UI system initialized", "DEBUG", "MAIN");
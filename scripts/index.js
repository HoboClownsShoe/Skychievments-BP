// scripts/index.js
import { world, system } from '@minecraft/server';
import { AdminMenu } from './ui/adminMenu';
import { PlayerMenu } from './ui/playerMenu';
import { CollectionManager, CollectionStorage, CollectionHandler, CollectionGroupManager } from './managers/collectionsManager';
import { MilestoneManager, MilestoneStorage, MilestoneHandler } from './managers/milestoneManager.js'
import { QuestPointsManager } from './managers/questPointManager.js'
import { itemDatabase } from './managers/itemManager.js'
import { Logger } from './utils/logger';
import { Permissions } from './utils/permissions';
import { showTipToast, showToast, showAchievementToast, sendNotification } from './utils/toast.js';
import { ChestFormData } from './extensions/forms.js';
import { KillTracker } from "detectors/killTracker.js"
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { JsonDatabase } from "./database/con-database.js";
import * as perf from "./tests/perf";
import Fakeplayer from "./fakePlayers/FakePlayers";
import HelpGuide from "./fakePlayers/Help";
import { StatisticsManager } from './managers/statisticsManager';

let host = [...world.getPlayers()][0];


//var PlayerStatisticsMap = /* @__PURE__ */ new Map();

// Initialize the system when the world starts
world.afterEvents.worldInitialize.subscribe(async () => {
    try {
        Logger.log("Initializing Skychievments system...", "DEBUG", "MAIN");

        let initSuccess = true;
        // Initialize logger first for proper debugging
        try {
            initSuccess = await Logger.initialize();
            Logger.log("Logging initialized", "DEBUG", "MAIN");
        } catch (loggerError) {
            Logger.log(`Failed to initialize storage system: ${loggerError}`, "ERROR", "MAIN");
            initSuccess = false;
        }

        // // Initialize storage system
        // try {
        //     initSuccess = await CollectionStorage.initialize();
        //     Logger.log("Collection storage system initialized", "DEBUG", "MAIN");
        // } catch (storageError) {
        //     Logger.log(`Failed to initialize storage system: ${storageError}`, "ERROR", "MAIN");
        //     initSuccess = false;
        // }

        try {
            initSuccess = await CollectionManager.initialize();
            Logger.log("Collection Manager initialized", "DEBUG", "MAIN");
        } catch (managerError) {
            Logger.log(`Failed to initialize collection manager: ${managerError}`, "ERROR", "MAIN");
            initSuccess = false;
        }

        try {
            initSuccess = await CollectionHandler.initialize();
            Logger.log("Collection handler initialized", "DEBUG", "MAIN");
        } catch (hadlerError) {
            Logger.log(`Failed to initialize collection handler: ${hadlerError}`, "ERROR", "MAIN");
            initSuccess = false;
        }



        // Load collections for each group
        if (initSuccess) {
            initSuccess = await CollectionGroupManager.initialize();
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

        try {
            initSuccess = await StatisticsManager.initialize();
            Logger.log("Statistics Manager initialized", "DEBUG", "MAIN");
        } catch (managerError) {
            Logger.log(`Failed to initialize Statistics manager: ${managerError}`, "ERROR", "MAIN");
            initSuccess = false;
        }

        try {
            initSuccess = await MilestoneManager.initialize();
            Logger.log("Milestone Manager initialized", "DEBUG", "MAIN");
        } catch (managerError) {
            Logger.log(`Failed to initialize Milestone manager: ${managerError}`, "ERROR", "MAIN");
            initSuccess = false;
        }

        try {
            initSuccess = await QuestPointsManager.initialize();
            Logger.log("Quest points Manager initialized", "DEBUG", "MAIN");
        } catch (managerError) {
            Logger.log(`Failed to initialize Quest Points manager: ${managerError}`, "ERROR", "MAIN");
            initSuccess = false;
        }

        // try {
        //     initSuccess = await itemDatabase.initialize();
        //     Logger.log("itemDatabase Manager initialized", "DEBUG", "MAIN");
        // }catch (managerError) {
        //     Logger.log(`Failed to initialize ItemDatabase : ${managerError}`, "ERROR", "MAIN");
        //     initSuccess = false;
        // }


        // Create admin_level objective if it doesn't exist
        if (!world.scoreboard.getObjective('admin_level')) {
            world.scoreboard.addObjective('admin_level', 'Admin Level');
            Logger.log("Created admin_level scoreboard objective", "DEBUG", "MAIN");
        }

        // Display initialization status to online admins
        for (const player of world.getAllPlayers()) {

            showTipToast(player, initSuccess ? 'finishInit' : 'failedInit');

            player.sendMessage('§7§oSkychievments system initializing...');


            if (Permissions.isAdmin(player)) {
                player.sendMessage(
                    initSuccess ?
                        "§q§lSkychievments initialized successfully!" :
                        "§c§lWarning: Some Skychievments collections failed to load. Check logs for details."
                );

            }
            if (!Permissions.isAdmin(player)) {

            }

            //PlayerStatisticsMap.set(player, new PlayerStatistics(player));
        }

        Logger.log("Skychievments UI system initialized", "DEBUG", "MAIN");




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

        // const mfd = new ChestFormData('54')
        // .title('Testing')
        // .button(6, 'Button Name', ['Lore'], 'minecraft:oak_log', 1 )
        // .button(53, 'Testing', ['Lore Lore'], 'minecraft:diamond', 1);


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

                CollectionHandler.checkGroupProgress(player, "group_mining");
                break;

            case "minecraft:clock":

                sendNotification(player, "Well Well Well....      \n§gFree Minecoins!! ", 'textures/ui/groupIcons/quest_book.png' , true);
                break;


                // const stats = StatisticsManager.getPlayerStats(player);

                // const db = new JsonDatabase("skychievments_stats_QAE_mined");
                // db.set("key1", "value1");
                // console.warn(db.size);

                // // Iterating over the map using for loop
                // for (const [key, value] of db) {
                // console.warn(`${key} = ${value}`);
                // }

                // const playerStat = db.get(player.id);

                

                //const myDB = new JsonDatabase("skychievments_stats_QAE:custom");

               //getting all data saved in database
                //for(const [key, value] of myDB.entries()){
                //    console.warn(key, value);
               // }


                //console.log("Starting benchmark");
               //perf.Main();
               // console.log("Benchmark complete");

                //player.onScreenDisplay.setActionBar('hello')
                //showToast(player, 'Well done, you mined a block!! \nHere have 10 points');

                //showTipToast(player, 'Well done, you mined a block!! \nHere have 10 points');

                //showAchievementToast(player, '017', 'achievement', 'textures/items/wheat', 'ach17');

                //player.sendMessage(`_r4ui:toast_0.header.01.body.017.slideshow_0.textures/items/wheat`);

                

                //showTipToast(player, 'hello');
                //mfd.show(player); 

                
        }
    } catch (error) {
        Logger.log(`Error handling item use: ${error}`, "ERROR", "MAIN");
        if (event.source) {
            event.source.sendMessage('§cAn error occurred while opening the menu.');
        }
    }
});

// Handle new player joins
world.afterEvents.playerSpawn.subscribe(async (event) => {
    try {
        let { initialSpawn, player } = event;
        if (!player.hasTag('skychievments')) {
            player.addTag('skychievments');
        }

        StatisticsManager.getPlayerStats(player);
        MilestoneHandler.initializePlayerMilestones(event.player);
        QuestPointsManager.initializePlayerPoints(event.player);

        console.log(`${event.player.typeId} spawned with id: ${event.player.id}`);
        showTipToast(player, "welcome");

        //if (!initialSpawn) return; // If it's not the first spawn, exit method
        //player.addTag('skychievments');
        //showTipToast(player, 'welcome');
    } catch (error) {
        Logger.log(`Error handling player spawn: ${error}`, "ERROR", "MAIN");
    }
});

// world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
//     //console.warn(`${entity.typeId} was spawned in the world because of ${cause}`)
//     if (entity.typeId === "minecraft:item") {
//         const itemStack = entity.getComponent("minecraft:item").itemStack;
//           console.log(`Tracking item: ${itemStack.typeId}`);
//       }
// });
// Track the last broken block's location and time
let lastBreakData = {
    x: 0,
    y: 0,
    z: 0,
    timestamp: 0
};

const SPAWN_TIME_THRESHOLD = 2; // ticks to consider spawns related to break

// Listen for block breaks
world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;
    
    // Store the block's location and time
    lastBreakData = {
        x: block.location.x,
        y: block.location.y,
        z: block.location.z,
        timestamp: system.currentTick
    };
});

// Track spawned items
let pendingItems = new Map();

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId === "minecraft:item") {
        const currentTick = system.currentTick;
        
        // Check if this spawn is close to our last broken block (both in space and time)
        const distance = Math.sqrt(
            Math.pow(entity.location.x - lastBreakData.x, 2) +
            Math.pow(entity.location.y - lastBreakData.y, 2) +
            Math.pow(entity.location.z - lastBreakData.z, 2)
        );
        
        const timeDiff = currentTick - lastBreakData.timestamp;
        
        // If this spawn is close to our break location and within our time threshold
        if (distance < 2 && timeDiff <= SPAWN_TIME_THRESHOLD) {
            const itemStack = entity.getComponent("minecraft:item").itemStack;
            const itemId = itemStack.typeId;
            const amount = itemStack.amount;
            
            pendingItems.set(itemId, (pendingItems.get(itemId) || 0) + amount);
            
            // Output results after a short delay
            system.runTimeout(() => {
                for (const [id, count] of pendingItems) {
                    console.warn(`${id} x${count}`);
                }
                pendingItems.clear();
            }, 1);
        }
    }
});


import 'fakePlayers/FakePlayers'
import 'fakePlayers/GameTest'


const ValidPrefixes = [
    '#fakeplayer',
    '#player',
    './fakeplayer',
    './player'
];

world.beforeEvents.chatSend.subscribe((ev) => {
    const cmd = ev.message.split(' ')[0];
    if (!ValidPrefixes.includes(cmd)) return;

    ev.cancel = true;
    system.run(() => FakeplayerCmd(ev))
});

const Database = new Map();

function FakeplayerCmd(ev) {
    let [_, username, action, ...params] = ev.message.split(' ');
    /*//////////////////
    *	Help Options
    *///////////////////
    if (!username || username == '--help') {
        let txt = '§lFakeplayer Guide:§r\n'
        let p = 0;

        txt += '§l[Valid prefixes]§r\n  - §7#fakeplayer§r\n   - §7#player§r\n  - §7./fakeplayer§r\n   - §7./player§r\n'
        txt += '§lFakeplayer Actions§r\n'


        for (let h in HelpGuide) {
            txt += `${p == 0 ? '  -' : '   -'} §7[prefix] §3<username> §2${h} §u${HelpGuide[h]}§r\n`
            p = (p + 1) % 2;
        }

        return world.sendMessage(txt.trim());
    }


    /*//////////////////
    *	Script Engine
    *///////////////////
    /* Comming soon) */


    /*//////////////////
    *	Fakeplayer
    *///////////////////
    action = action ? action.toLowerCase() : 'invalid';

    const SingleActions = ['attack', 'jump', 'shift', 'minecraft', 'trident', 'stop', 'breakblock', 'build', 'dismount']
    const SenderActions = ['respawn', 'teleport', 'look'];
    const ParamsActions = ['hotbar', 'dropslot', 'useitem', 'interact'];

    const ItsSingleAction = SingleActions.includes(action);
    const ItsSenderAction = SenderActions.includes(action);
    const ItsParamsAction = ParamsActions.includes(action);

    // Connect 
    if (action === 'spawn') {
        // Check if it's already connected
        if (Database.has(username)) {
            return world.sendMessage(`§e"${username}" it's already connected`)
        }
        // Connect 
        const fp = new Fakeplayer(username, ev.sender);
        Database.set(username, fp);
    }

    // Disconnect
    else if (action === 'kill') CheckPlayer(username, (fp) => {
        fp.stop();
        fp.kill();
        fp.disconnect();
        Database.delete(username);
    });

    // Repeat
    else if (action === 'repeat') CheckPlayer(username, (fp) => {
        const [ActionToRepeat = 'invalid', Mode = 'default'] = params;
        fp[action](ActionToRepeat.toLowerCase(), [Mode]);
    });

    // Params Actions
    else if (ItsParamsAction) CheckPlayer(username, (fp) => {
        let param = params[0] || 'default';

        if (action == 'hotbar' || action == 'dropslot') {
            param = parseInt(param) || 0;
        }

        fp[action](param);
    });

    // Single Actions
    else if (ItsSingleAction) CheckPlayer(username, (fp) => {
        fp[action]();
    });

    // Sender Actions
    else if (ItsSenderAction) CheckPlayer(username, (fp) => {
        fp[action](ev.sender);
    });

    // Default Output
    else world.sendMessage('§cInvalid action!');
}

// Players DB
function CheckPlayer(username, callback) {
    if (Database.has(username)) {
        const player = Database.get(username);
        return callback(player);
    }
    world.sendMessage('§7You can only manipulate connected players!')
}

function onPlayerBreakBlock(event) {
    const { player, brokenBlockPermutation } = event;

    const stats = StatisticsManager.getPlayerStats(player);
    if (!stats) {
        throw new Error("Player statistics not initialized");
    }

    stats.blockMined.addBlockType(brokenBlockPermutation.type);
    Logger.log(`Updated block count for player ${player.name}: ${brokenBlockPermutation.typeId}`, "DEBUG", "INDEX");
    stats.custom.addStatistic("minecraft:blocks_mined" /* blocksMined */, 1);
}

function onPlayerPlacedBlock(event) {
    const { player, block } = event;

    const stats = StatisticsManager.getPlayerStats(player);
    if (!stats) {
        throw new Error("Player statistics not initialized");
    }

    stats.blockPlaced.addBlockType(block.type);
    Logger.log(`Updated block count for player ${player.name}: ${block.typeId}`, "DEBUG", "INDEX");
    stats.custom.addStatistic("minecraft:blocks_placed" /* blocksPlaced */, 1);
}

function getMainHand(param) {
    const hand = param.getComponent("equippable").getEquipmentSlot("Mainhand");

    
    const sharpness = weapon?.getComponent("enchantable")?.getEnchantment("sharpness").level;
    console.warn(sharpness);

    //const enchantments = hand.getComponent('enchantable')?.getEnchantments() || [];
   
    // const enc = hand.getComponent("enchantable").getEnchantments();
    // for (let i = 0; i < enc.length; i++) {
    // console.warn(enc.type.id)

    return hand.hasItem() && hand;
    
};

import { Player as Player10 } from "@minecraft/server";
function onEntityKilled(event) {
    const { deadEntity, damageSource } = event;
    const { damagingEntity } = damageSource;
    if (damagingEntity instanceof Player10) { // if player is the damaging entity

        const stats = StatisticsManager.getPlayerStats(damagingEntity);
       // const hand = getMainHand(damagingEntity);
        if (!stats) {
            throw new Error("Player statistics not initialized");
        }
        stats.entityKilled.addEntity(deadEntity) // add entity to list of entities killed by player

        Logger.log(`Updated kill count for player ${damagingEntity.name}: ${deadEntity.typeId}`, "DEBUG", "INDEX");

        if (deadEntity instanceof Player10) // if dead entity is a player increment player kills, else increment mob kills
            stats.custom.addStatistic("minecraft:player_kills" /* playerKills */, 1);
        else stats.custom.addStatistic("minecraft:mob_kills" /* mobKills */, 1);
    }
    if (deadEntity instanceof Player10 && damagingEntity) {

        const stats = StatisticsManager.getPlayerStats(deadEntity);
        if (!stats) {
            throw new Error("Player statistics not initialized");
        }
        stats.entityKilledBy.addEntity(damagingEntity);

    } else if (deadEntity instanceof Player10) { // if player is the dead entity increment Deaths

        const stats = StatisticsManager.getPlayerStats(deadEntity);
        if (!stats) {
            throw new Error("Player statistics not initialized");
        }

        stats.custom.addStatistic("minecraft:deaths" /* deaths */);
        Logger.log(`Updated death count for player ${deadEntity.typeId}`, "DEBUG", "INDEX");
    }
}

//players travvelling 
/**************************************************************************************************/
// src/statistics/custom/TravelDistance.ts
import { system as system14, world as world11 } from "@minecraft/server";

// src/utilities/isMoving.ts
import { Entity as Entity2, Player as Player17 } from "@minecraft/server";
function MathRound(x) {
  return Math.round(x * 1e3) / 1e3;
}
function isMoving(entity) {
  if (!(entity instanceof Player17) && !(entity instanceof Entity2)) throw new TypeError("Parameter is not Entity or Player");
  const vector = {
    x: MathRound(entity.getVelocity().x),
    y: MathRound(entity.getVelocity().y),
    z: MathRound(entity.getVelocity().z)
  };
  if (vector.x === 0 && vector.y === 0 && vector.z === 0) return false;
  else return true;
}
var isMoving_default = isMoving;

// src/statistics/custom/TravelDistance.ts
var fallDistanceMap = /* @__PURE__ */ new Map();
// system14.runInterval(() => {
//   for (const player of world11.getAllPlayers()) {
//     const stats = StatisticsManager.getPlayerStats(player);
//     if (!stats) continue;
//     const velocity = player.getVelocity();
//     const velocityCm = Math.hypot(velocity.x, velocity.y, velocity.z) * 100;
//     const playerIsMoving = isMoving_default(player);
//     const heightRange = player.dimension.heightRange;
//     if (!playerIsMoving) {
//       continue;
//     }
//     if (player.isClimbing) {
//       const climbCm = Math.abs(velocity.y) * 100;
//       stats.custom.addStatistic("minecraft:climb_one_cm" /* climbOneCm */, climbCm);
//     }
//     if (player.isSneaking) {
//       stats.custom.addStatistic("minecraft:crouch_one_cm" /* crouchOneCm */, velocityCm);
//     }
//     if (player.isFlying) {
//       stats.custom.addStatistic("minecraft:fly_one_cm" /* flyOneCm */, velocityCm);
//     }
//     if (player.isSprinting && player.isOnGround) {
//       stats.custom.addStatistic("minecraft:sprint_one_cm" /* sprintOneCm */, velocityCm);
//     } else if (player.isOnGround && velocity.y === 0) {
//       stats.custom.addStatistic("minecraft:walk_one_cm" /* walkOneCm */, velocityCm);
//     }
//     if (player.isSwimming) {
//       stats.custom.addStatistic("minecraft:swim_one_cm" /* swimOneCm */, velocityCm);
//     }
//     if (player.isGliding) {
//       stats.custom.addStatistic("minecraft:aviate_one_cm" /* aviateOneCm */, velocityCm);
//     }
//   }
// });
// system14.runInterval(() => {
//   for (const player of world11.getAllPlayers()) {
//     const fallDistance = fallDistanceMap.get(player) ?? 0;
//     const jumpBoostEffect = player.getEffect("minecraft:jump_boost");
//     let jumpHeight = 1.2522;
//     if (jumpBoostEffect) {
//       jumpHeight = 0.0308354 * jumpBoostEffect.amplifier ** 2 + 0.744631 * jumpBoostEffect.amplifier + 1.836131;
//     }
//     if (player.isFalling) {
//       fallDistanceMap.set(player, fallDistance + Math.abs(player.getVelocity().y));
//     } else if (fallDistance > jumpHeight) {
//       const stats = StatisticsManager.getPlayerStats(player);
//       if (!stats) throw new ReferenceError("Player not found");
//       fallDistanceMap.set(player, 0);
//     } else {
//       fallDistanceMap.set(player, 0);
//     }
//   }
// });
/**************************************************************************************************/

world.afterEvents.playerBreakBlock.subscribe(onPlayerBreakBlock);
world.afterEvents.entityDie.subscribe(onEntityKilled);
world.afterEvents.playerPlaceBlock.subscribe(onPlayerPlacedBlock);
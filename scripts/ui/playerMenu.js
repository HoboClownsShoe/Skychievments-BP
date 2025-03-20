// scripts/ui/playerMenu.js
import { ActionFormData, MessageFormData } from '@minecraft/server-ui';
import { CollectionManager, CollectionStorage, CollectionHandler, CollectionGroupManager } from '../managers/collectionsManager';
import { MilestoneManager, MilestoneStorage, MilestoneHandler } from '../managers/milestoneManager.js'
import { QuestPointsManager } from '../managers/questPointManager.js'
import { MILESTONES } from '../config/milestones'
import { Logger } from '../utils/logger.js';
import { StatValueFormatter } from '../utils/helpers.js';
import { TicksPerSecond, world } from "@minecraft/server";
import { KillTracker } from "detectors/killTracker.js"
import { ChestFormData } from '../extensions/forms.js';
import { MOBLIST } from '../config/mobsList.js';
import { StatisticsManager } from '../managers/statisticsManager.js';
import { system } from "@minecraft/server";



export class PlayerMenu {
    // main menu to display whn player opens Qae Book
    static async showMainMenu(player) {
        try {

            console.log(`${player.id} opened his book`);
            const menu = new ActionFormData()
                .title("Skychievments")
                .body("§7Select a category to view:\n")
                .button("Quests", "textures/ui/groupIcons/quest_book.png")
                .button("Milestones", "textures/ui/groupIcons/banner_pattern.png")
                .button("Stats", "textures/ui/groupIcons/stats_icon.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                switch (response.selection) {
                    case 0:
                        await this.showCollectionsMenu(player);
                        break;
                    case 1:
                        await this.showMilestonesMenu(player);
                        break;
                    case 2:
                        await this.showPlayerStats(player);
                        break;

                }
            }
        } catch (error) {
            Logger.log(`Error in main menu: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while opening the menu.');
        }
    }

    // catergory menu for players indivdual stats
    static async showPlayerStats(player) {
        try {
            // Get statistics from JSONDatabase
            const playerStats = StatisticsManager.getPlayerStats(player);
            if (!playerStats) {
                throw new Error("Player statistics not initialized");
            }

            // Get dynamic properties
            const dynamicProps = player.getDynamicPropertyIds();
            const questPoints = await QuestPointsManager.getPlayerPoints(player);

            // Create main statistics menu
            const statsForm = new ChestFormData('54')
            //.title('chestUI_54.png')    
            .title('Player Statistics')
                .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

            // Quest Points Display
            statsForm.button(
                4,
                '§l§eQuest Points',
                [
                    `§7Total Points: §6${questPoints.toLocaleString()}`,
                    '',
                    '§7Earn points by completing',
                    '§7quests and milestones!'
                ],
                'textures/ui/star',
                1
            );

            // Database Statistics Section
            statsForm.button(
                10,
                '§l§eMining Statistics',
                [
                    `§7Total Blocks: §f${playerStats.blockMined.getTotalValue()}`,
                    `§7Unique Blocks: §f${Object.keys(playerStats.blockMined.getAllStatistics()).length}`,
                    '',
                    '§7Click for details'
                ],
                'textures/items/diamond_pickaxe',
                1
            );

            statsForm.button(
                19,
                '§l§eBuilding Statistics',
                [
                    `§7Total Blocks: §f${playerStats.blockPlaced.getTotalValue()}`,
                    `§7Unique Blocks: §f${Object.keys(playerStats.blockPlaced.getAllStatistics()).length}`,
                    '',
                    '§7Click for details'
                ],
                'textures/items/diamond_shovel',
                1
            );

            statsForm.button(
                12,
                '§l§cCombat Statistics',
                [
                    `§7Kills: §f${playerStats.entityKilled.getTotalValue()}`,
                    `§7Deaths: §f${playerStats.entityKilledBy.getTotalValue()}`,
                    '',
                    '§7Click for details'
                ],
                'textures/items/diamond_sword',
                1
            );

            statsForm.button(
                14,
                '§l§bPlayer Statistics',
                [
                    `§7Custom Stats: §f${Object.keys(playerStats.custom.getAllStatistics()).length}`,
                    '',
                    '§7Click for details'
                ],
                'textures/ui/player',
                1
            );

            // Dynamic Properties Section
            // Only show if there are properties to display
            if (dynamicProps.length > 0) {
                statsForm.button(
                    25,
                    '§l§dDynamic Properties',
                    [
                        `§7Total Properties: §f${dynamicProps.length}`,
                        '',
                        '§7Click to view properties'
                    ],
                    'textures/ui/debug_glyph_color',
                    1
                );
            }

            const response = await statsForm.show(player);

            // Handle navigation
            if (response.canceled || response.selection === 0) {
                await this.showMainMenu(player);
                return;
            }

            // Handle button clicks
            switch (response.selection) {
                case 4:
                    await this.showQuestPointsDetails(player);
                    break;
                case 10:
                    await this.showDetailedMiningStats(player);
                    break;
                case 19:
                    await this.showDetailedBuildingStats(player);
                    break;
                case 12:
                    await this.showDetailedCombatStats(player);
                    break;
                case 14:
                    await this.showDetailedCustomStats(player);
                    break;
                case 16:
                    await this.showDynamicProperties(player);
                    break;
            }

        } catch (error) {
            Logger.log(`Error showing player stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing statistics.');
        }
    }

    static async showQuestPointsDetails(player) {
        try {
            const points = await QuestPointsManager.getPlayerPoints(player);
            const menu = new ChestFormData('54')
                .title('Quest Points Details')
                .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default')
                .button(
                    13,
                    '§l§6Quest Points',
                    [
                        `§7Current Points: §6${points.toLocaleString()}`,
                        '',
                        '§7Quest Points are earned by:',
                        '§7• Completing Quests',
                        '§7• Achieving Milestones',
                        '§7• Special Events',
                        '',
                        '§7Use points to unlock:',
                        '§7• Special Rewards',
                        '§7• Unique Items',
                        '§7• And more!'
                    ],
                    'textures/ui/star',
                    1
                );

            const response = await menu.show(player);

            if (response.canceled || response.selection === 0) {
                await this.showPlayerStats(player);
            }
        } catch (error) {
            Logger.log(`Error showing quest points details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing quest points details.');
        }
    }

    // Helper method for showing detailed mining statistics (only shows blocks with stats)
    static async showDetailedMiningStats(player) {
        try {

            const playerStats = StatisticsManager.getPlayerStats(player);
            if (!playerStats) {
                throw new Error("Player statistics not initialized");
            }
            const miningStats = playerStats.blockMined.getAllStatistics();
            // Sort blocks by most mined
            const sortedBlocks = Object.entries(miningStats)
                .sort(([, a], [, b]) => b - a);

            // Create paginated view for the mobs in this category
            let currentPage = 0;
            const ITEMS_PER_PAGE = 45; // Leave room for navigation
            const totalPages = Math.ceil(sortedBlocks.length / ITEMS_PER_PAGE);


            while (true) {
                const startIndex = currentPage * ITEMS_PER_PAGE;
                const pageItems = sortedBlocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                const statsForm = new ChestFormData('54')
                    .title('Mining Statistics')
                    .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

                // Add pagination buttons if needed
                if (currentPage > 0) {
                    statsForm.button(3, '§l§ePrevious Page', ['', `§r§ePage ${currentPage}/${totalPages}`], 'textures/ui/arrow_left');
                }
                if (currentPage < totalPages - 1) {
                    statsForm.button(5, '§l§eNext Page', ['', `§r§ePage ${currentPage + 2}/${totalPages}`], 'textures/ui/arrow_right');
                }

                // Add buttons for each block type
                let slot = 9;
                for (const [blockId, count] of pageItems) {
                    // Format block name for display
                    const blockName = blockId.split(':')[1]
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    statsForm.button(
                        slot,
                        blockName,
                        [`§7Blocks Mined: §f${count}`],
                        blockId,
                        1
                    );
                    slot++;
                }

                const response = await statsForm.show(player);

                // Handle form closure or back button
                if (response.canceled) {
                    await this.showPlayerStats(player);
                    return;
                }

                // Handle back button
                if (response.selection === 0) {
                    await this.showPlayerStats(player);
                    return;
                }

                // Handle pagination
                if (response.selection === 3 && currentPage > 0) {
                    currentPage--;
                    continue;
                }
                if (response.selection === 5 && currentPage < totalPages - 1) {
                    currentPage++;
                    continue;
                }

                // If we get here, just show the stats menu
                await this.showPlayerStats(player);
                return;
            }

        } catch (error) {
            Logger.log(`Error showing mining stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing mining statistics.');
        }

    }

    // Helper method for showing detailed building statistics (only shows blocks with stats)
    static async showDetailedBuildingStats(player) {
        try {
            const playerStats = StatisticsManager.getPlayerStats(player);
            if (!playerStats) {
                throw new Error("Player statistics not initialized");
            }
            const buildingStats = playerStats.blockPlaced.getAllStatistics();
            // Sort blocks by most mined
            const sortedBlocks = Object.entries(buildingStats)
                .sort(([, a], [, b]) => b - a);

            // Create paginated view for the mobs in this category
            let currentPage = 0;
            const ITEMS_PER_PAGE = 45; // Leave room for navigation
            const totalPages = Math.ceil(sortedBlocks.length / ITEMS_PER_PAGE);

            while (true) {
                const startIndex = currentPage * ITEMS_PER_PAGE;
                const pageItems = sortedBlocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                const statsForm = new ChestFormData('54')
                    .title('Building Statistics')
                    .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

                // Add pagination buttons if needed
                if (currentPage > 0) {
                    statsForm.button(3, '§l§ePrevious Page', ['', `§r§ePage ${currentPage}/${totalPages}`], 'textures/ui/arrow_left');
                }

                if (currentPage < totalPages - 1) {
                    statsForm.button(5, '§l§eNext Page', ['', `§r§ePage ${currentPage + 2}/${totalPages}`], 'textures/ui/arrow_right');
                }

                // Add buttons for each block type
                let slot = 9;
                for (const [blockId, count] of pageItems) {
                    // Format block name for display
                    const blockName = blockId.split(':')[1]
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    statsForm.button(
                        slot,
                        blockName,
                        [`§7Blocks Mined: §f${count}`],
                        blockId,
                        1
                    );
                    slot++;
                }

                const response = await statsForm.show(player);

                // Handle form closure or back button
                if (response.canceled) {
                    await this.showPlayerStats(player);
                    return;
                }

                // Handle back button
                if (response.selection === 0) {
                    await this.showPlayerStats(player);
                    return;
                }

                // Handle pagination
                if (response.selection === 3 && currentPage > 0) {
                    currentPage--;
                    continue;
                }
                if (response.selection === 5 && currentPage < totalPages - 1) {
                    currentPage++;
                    continue;
                }

                // If we get here, just show the stats menu
                await this.showPlayerStats(player);
                return;
            }
        } catch (error) {
            Logger.log(`Error showing building stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing building statistics.');
        }

    }

    // display overal combat stats and mob categories
    static async showDetailedCombatStats(player) {
        try {
            const playerStats = StatisticsManager.getPlayerStats(player);
            const killStats = playerStats.entityKilled.getAllStatistics();
            const deathStats = playerStats.entityKilledBy.getAllStatistics();

            // Calculate overall combat stats
            const totalKills = playerStats.entityKilled.getTotalValue();
            const totalDeaths = playerStats.entityKilledBy.getTotalValue();
            const kdr = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills;

            // Create the main combat category selection menu
            const statsForm = new ChestFormData('54')
                .title('Combat Statistics')
                .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default')
                .button(4, '§l§cOverall Combat Stats',
                    [
                        `§7Total Kills: §a${totalKills}`,
                        `§7Total Deaths: §c${totalDeaths}`,
                        `§7K/D Ratio: §e${kdr}`,
                        '',
                        '§7Click for combat overview'
                    ],
                    'textures/items/diamond_sword'
                );

            // Add buttons for each mob category from mobsList.js
            let slot = 19;
            for (const [categoryId, category] of Object.entries(MOBLIST)) {
                // Calculate stats for this category
                const mobsInCategory = category.items.map(item => item.id);
                const categoryKills = mobsInCategory.reduce((sum, mobId) => sum + (killStats[mobId] || 0), 0);
                const categoryDeaths = mobsInCategory.reduce((sum, mobId) => sum + (deathStats[mobId] || 0), 0);

                statsForm.button(
                    slot,
                    `§l${category.name}`,
                    [
                        `§7${category.description}`,
                        '',
                        `§7Kills: §a${categoryKills}`,
                        `§7Deaths: §c${categoryDeaths}`,
                        `§7Mob Types: §f${category.items.length}`,
                        '',
                        '§7Click to view mob details'
                    ],
                    category.icon,
                    1
                );
                slot += 2;
            }

            const response = await statsForm.show(player);

            if (response.canceled || response.selection === 0) {
                await this.showPlayerStats(player);
                return;
            }

            if (response.selection === 4) {
                // Show overall combat overview
                await this.showOverallCombatStats(player, killStats, deathStats);
                return;
            }

            // Calculate which category was selected
            const categoryIndex = Math.floor((response.selection - 19) / 2);
            const selectedCategory = Object.entries(MOBLIST)[categoryIndex];

            if (selectedCategory) {
                await this.showMobCategoryStats(player, selectedCategory[1], killStats, deathStats);
            }

        } catch (error) {
            Logger.log(`Error showing combat stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing combat statistics.');
        }
    }

    // stast for mobs in selected mob category ( will display all mobs even if no stats recorded)
    static async showMobCategoryStats(player, category, killStats, deathStats) {
        try {
            // Create paginated view for the mobs in this category
            let currentPage = 0;
            const ITEMS_PER_PAGE = 45; // Leave room for navigation
            const totalPages = Math.ceil(category.items.length / ITEMS_PER_PAGE);

            while (true) {
                const startIndex = currentPage * ITEMS_PER_PAGE;
                const pageItems = category.items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                const mobForm = new ChestFormData('54')
                    .title(`${category.name} : ${currentPage + 1}/${totalPages}`)
                    .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

                // Add pagination buttons if needed
                if (currentPage > 0) {
                    mobForm.button(3, '§l§ePrevious Page', ['', `§r§ePage ${currentPage}/${totalPages}`], 'textures/ui/arrow_left');
                }
                if (currentPage < totalPages - 1) {
                    mobForm.button(5, '§l§eNext Page', ['', `§r§ePage ${currentPage + 2}/${totalPages}`], 'textures/ui/arrow_right');
                }

                // Add mob statistics buttons
                let slot = 9;
                for (const mob of pageItems) {
                    const kills = killStats[mob.id] || 0;
                    const deaths = deathStats[mob.id] || 0;
                    const kdr = deaths > 0 ? (kills / deaths).toFixed(2) : kills;

                    mobForm.button(
                        slot,
                        mob.name,
                        [
                            `§7Kills: §a${kills}`,
                            `§7Deaths: §c${deaths}`,
                            `§7K/D Ratio: §e${kdr}`,
                            '',
                            '§7Mob ID: §8${mob.id}'
                        ],
                        mob.texture,
                        1
                    );
                    slot++;
                }

                const response = await mobForm.show(player);

                // Handle navigation
                if (response.canceled || response.selection === 0) {
                    await this.showDetailedCombatStats(player);
                    return;
                }

                // Handle pagination
                if (response.selection === 3 && currentPage > 0) {
                    currentPage--;
                    continue;
                }
                if (response.selection === 5 && currentPage < totalPages - 1) {
                    currentPage++;
                    continue;
                }
            }

        } catch (error) {
            Logger.log(`Error showing mob category stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing mob statistics.');
        }
    }

    // short menu showing only those mobs with stats recorded
    static async showOverallCombatStats(player, killStats, deathStats) {
        try {
            // Create a sorted list of all mobs by total interactions (kills + deaths)
            const allMobs = new Set([...Object.keys(killStats), ...Object.keys(deathStats)]);
            const mobStats = Array.from(allMobs).map(mobId => {
                const kills = killStats[mobId] || 0;
                const deaths = deathStats[mobId] || 0;
                return {
                    id: mobId,
                    kills,
                    deaths,
                    total: kills + deaths,
                    kdr: deaths > 0 ? kills / deaths : kills
                };
            }).sort((a, b) => b.total - a.total);

            // Show paginated view of top mobs
            let currentPage = 0;
            const ITEMS_PER_PAGE = 45;
            const totalPages = Math.ceil(mobStats.length / ITEMS_PER_PAGE);

            while (true) {
                const startIndex = currentPage * ITEMS_PER_PAGE;
                const pageMobs = mobStats.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                const overviewForm = new ChestFormData('54')
                    .title(`Combat Overview - Page ${currentPage + 1}/${totalPages}`)
                    .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

                // Add pagination buttons if needed
                if (currentPage > 0) {
                    overviewForm.button(3, '§l§ePrevious Page', ['', `§r§ePage ${currentPage}/${totalPages}`], 'textures/ui/arrow_left');
                }
                if (currentPage < totalPages - 1) {
                    overviewForm.button(5, '§l§eNext Page', ['', `§r§ePage ${currentPage + 2}/${totalPages}`], 'textures/ui/arrow_right');
                }

                // Add mob statistics buttons
                let slot = 9;
                for (const mob of pageMobs) {
                    // Find mob info from MOBLIST
                    const mobInfo = this.findMobInfo(mob.id);

                    overviewForm.button(
                        slot,
                        mobInfo ? mobInfo.name : this.formatMobName(mob.id),
                        [
                            `§7Kills: §a${mob.kills}`,
                            `§7Deaths: §c${mob.deaths}`,
                            `§7K/D Ratio: §e${mob.kdr.toFixed(2)}`,
                            `§7Total Interactions: §f${mob.total}`,
                            '',
                            '§8' + mob.id
                        ],
                        mobInfo ? mobInfo.texture : 'textures/items/diamond_sword',
                        1
                    );
                    slot++;
                }

                const response = await overviewForm.show(player);

                // Handle navigation
                if (response.canceled || response.selection === 0) {
                    await this.showDetailedCombatStats(player);
                    return;
                }

                // Handle pagination
                if (response.selection === 3 && currentPage > 0) {
                    currentPage--;
                    continue;
                }
                if (response.selection === 5 && currentPage < totalPages - 1) {
                    currentPage++;
                    continue;
                }
            }

        } catch (error) {
            Logger.log(`Error showing overall combat stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing combat overview.');
        }
    }

    // Helper method to find mob info from MOBLIST
    static findMobInfo(mobId) {
        for (const category of Object.values(MOBLIST)) {
            const mobInfo = category.items.find(item => item.id === mobId);
            if (mobInfo) return mobInfo;
        }
        return null;
    }

    // Helper method to format mob names when not found in MOBLIST
    static formatMobName(mobId) {
        return mobId.split(':')[1]
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Helper method to show detailed stats for a specific category
    static async showCustomStatCategory(player, category, customStats) {
        try {
            // Filter to only available stats
            const availableStats = category.stats.filter(stat =>
                customStats[stat.key] !== undefined
            );

            const statsForm = new ChestFormData('54')
                .title(category.name)
                .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

            // Add stat buttons
            let slot = 10;
            for (const stat of availableStats) {
                const value = customStats[stat.key];
                const formattedValue = stat.format(value);

                statsForm.button(
                    slot,
                    stat.display,
                    [
                        `§7Value: §f${formattedValue}`,
                        '',
                        '§8' + stat.key
                    ],
                    category.icon,
                    1
                );
                slot++;
            }

            const response = await statsForm.show(player);
            if (response.canceled || response.selection === 0) {
                await this.showDetailedCustomStats(player);
            }

        } catch (error) {
            Logger.log(`Error showing category stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing category statistics.');
        }
    }

    // form to show any custom stats recorded for player (the custom stats are defined in the statsManager)
    static async showDetailedCustomStats(player) {
        try {
            const playerStats = StatisticsManager.getPlayerStats(player);
             
            var customStats = [
                { statistic: "minecraft:walk_one_cm" /* walkOneCm */, translate: "Walked" /*"stat.minecraft.walk_one_cm"*/, type: "distance", icon: "textures/items/iron_boots.png" },
                { statistic: "minecraft:sprint_one_cm" /* sprintOneCm */, translate: "stat.minecraft.sprint_one_cm", type: "distance", icon: "textures/items/diamond_boots.png" },
                { statistic: "minecraft:crouch_one_cm" /* crouchOneCm */, translate: "stat.minecraft.crouch_one_cm", type: "distance", icon: "textures/items/gold_boots.png" },
                { statistic: "minecraft:aviate_one_cm" /* aviateOneCm */, translate: "stat.minecraft.aviate_one_cm", type: "distance", icon: "textures/items/elytra.png" },
                { statistic: "minecraft:fly_one_cm" /* flyOneCm */, translate: "stat.minecraft.fly_one_cm", type: "distance", icon: "textures/ui/player" },
                { statistic: "minecraft:swim_one_cm" /* swimOneCm */, translate: "stat.minecraft.swim_one_cm", type: "distance", icon: "textures/items/turtle_helmet.png" },
                { statistic: "minecraft:climb_one_cm" /* climbOneCm */, translate: "stat.minecraft.climb_one_cm", type: "distance", icon: "textures/items/ladder.png" }
                



                // { statistic: CustomStatistic.animalsBred, translate: "stat.minecraft.animals_bred", type: "int" },
                //{ statistic: "minecraft:clean_armor" /* cleanArmor */, translate: "stat.minecraft.clean_armor", type: "int" },
                //{ statistic: "minecraft:clean_banner" /* cleanBanner */, translate: "stat.minecraft.clean_banner", type: "int" },
                //{ statistic: "minecraft:open_barrel" /* openBarrel */, translate: "stat.minecraft.open_barrel", type: "int" },
                //{ statistic: "minecraft:bell_ring" /* bellRing */, translate: "stat.minecraft.bell_ring", type: "int" },
                //{ statistic: "minecraft:eat_cake_slice" /* eatCakeSlice */, translate: "stat.minecraft.eat_cake_slice", type: "int" },
                //{ statistic: "minecraft:fill_cauldron" /* fillCauldron */, translate: "stat.minecraft.fill_cauldron", type: "int" },
                //{ statistic: "minecraft:open_chest" /* openChest */, translate: "stat.minecraft.open_chest", type: "int" },
                // { statistic: CustomStatistic.damageAbsorbed, translate: "stat.minecraft.damage_absorbed", type: "float" },
                // { statistic: CustomStatistic.damageBlockedByShield, translate: "stat.minecraft.damage_blocked_by_shield", type: "float" },
        //{ statistic: "minecraft:damage_dealt" /* damageDealt */, translate: "stat.minecraft.damage_dealt", type: "float" },
                // { statistic: CustomStatistic.damageDealtAbsorbed, translate: "stat.minecraft.damage_dealt_absorbed", type: "float" },
                // { statistic: CustomStatistic.damageDealtResisted, translate: "stat.minecraft.damage_dealt_resisted", type: "float" },
                // { statistic: CustomStatistic.damageResisted, translate: "stat.minecraft.damage_resisted", type: "float" },
        //{ statistic: "minecraft:damage_taken" /* damageTaken */, translate: "stat.minecraft.damage_taken", type: "float" },
                //{ statistic: "minecraft:inspect_dispenser" /* inspectDispenser */, translate: "stat.minecraft.inspect_dispenser", type: "int" },
                // { statistic: CustomStatistic.fallOneCm, translate: "stat.minecraft.fall_one_cm", type: "distance" },
                
                //{ statistic: "minecraft:walk_on_water_one_cm" /* walkOnWaterOneCm */, translate: "stat.minecraft.walk_on_water_one_cm", type: "distance" },
                //{ statistic: "minecraft:walk_under_water_one_cm" /* walkUnderWaterOneCm */, translate: "stat.minecraft.walk_under_water_one_cm", type: "distance" },
                // { statistic: CustomStatistic.boatOneCm, translate: "stat.minecraft.boat_one_cm", type: "distance" },
                
                // { statistic: CustomStatistic.horseOneCm, translate: "stat.minecraft.horse_one_cm", type: "distance" },
                // { statistic: CustomStatistic.minecartOneCm, translate: "stat.minecraft.minecart_one_cm", type: "distance" },
                // { statistic: CustomStatistic.pigOneCm, translate: "stat.minecraft.pig_one_cm", type: "distance" },
                // { statistic: CustomStatistic.striderOneCm, translate: "stat.minecraft.strider_one_cm", type: "distance" },
                //{ statistic: "minecraft:inspect_dropper" /* inspectDropper */, translate: "stat.minecraft.inspect_dropper", type: "int" },
                //{ statistic: "minecraft:open_enderchest" /* openEnderchest */, translate: "stat.minecraft.open_enderchest", type: "int" },
                //{ statistic: CustomStatistic.fishCaught, translate: "stat.minecraft.fish_caught", type: "int" },
                //{ statistic: "minecraft:leave_game" /* leaveGame */, translate: "stat.minecraft.leave_game", type: "int" },
                //{ statistic: "minecraft:inspect_hopper" /* inspectHopper */, translate: "stat.minecraft.inspect_hopper", type: "int" },
                //{ statistic: "minecraft:interact_with_anvil" /* interactWithAnvil */, translate: "stat.minecraft.interact_with_anvil", type: "int" },
                //{ statistic: "minecraft:interact_with_beacon" /* interactWithBeacon */, translate: "stat.minecraft.interact_with_beacon", type: "int" },
                //{ statistic: "minecraft:interact_with_blast_furnace" /* interactWithBlastFurnace */, translate: "stat.minecraft.interact_with_blast_furnace", type: "int" },
                //{ statistic: "minecraft:interact_with_brewingstand" /* interactWithBrewingstand */, translate: "stat.minecraft.interact_with_brewingstand", type: "int" },
                //{ statistic: "minecraft:interact_with_campfire" /* interactWithCampfire */, translate: "stat.minecraft.interact_with_campfire", type: "int" },
                //{ statistic: "minecraft:interact_with_cartography_table" /* interactWithCartographyTable */, translate: "stat.minecraft.interact_with_cartography_table", type: "int" },
                //{ statistic: "minecraft:interact_with_crafting_table" /* interactWithCraftingTable */, translate: "stat.minecraft.interact_with_crafting_table", type: "int" },
                //{ statistic: "minecraft:interact_with_furnace" /* interactWithFurnace */, translate: "stat.minecraft.interact_with_furnace", type: "int" },
                //{ statistic: "minecraft:interact_with_grindstone" /* interactWithGrindstone */, translate: "stat.minecraft.interact_with_grindstone", type: "int" },
                //{ statistic: "minecraft:interact_with_lectern" /* interactWithLectern */, translate: "stat.minecraft.interact_with_lectern", type: "int" },
                //{ statistic: "minecraft:interact_with_loom" /* interactWithLoom */, translate: "stat.minecraft.interact_with_loom", type: "int" },
                //{ statistic: "minecraft:interact_with_smithing_table" /* interactWithSmithingTable */, translate: "stat.minecraft.interact_with_smithing_table", type: "int" },
                //{ statistic: "minecraft:interact_with_smoker" /* interactWithSmoker */, translate: "stat.minecraft.interact_with_smoker", type: "int" },
                //{ statistic: "minecraft:interact_with_stonecutter" /* interactWithStonecutter */, translate: "stat.minecraft.interact_with_stonecutter", type: "int" },
                //{ statistic: "minecraft:drop" /* drop */, translate: "stat.minecraft.drop", type: "int" },
                //{ statistic: CustomStatistic.enchantItem, translate: "stat.minecraft.enchant_item", type: "int" },
                //{ statistic: "minecraft:jump" /* jump */, translate: "stat.minecraft.jump", type: "int" },
                //{ statistic: "minecraft:mob_kills" /* mobKills */, translate: "stat.minecraft.mob_kills", type: "int" },
                //{ statistic: "minecraft:play_record" /* playRecord */, translate: "stat.minecraft.play_record", type: "int" },
                //{ statistic: "minecraft:play_noteblock" /* playNoteblock */, translate: "stat.minecraft.play_noteblock", type: "int" },
                //{ statistic: "minecraft:tune_noteblock" /* tuneNoteblock */, translate: "stat.minecraft.tune_noteblock", type: "int" },
                //{ statistic: "minecraft:deaths" /* deaths */, translate: "stat.minecraft.deaths", type: "int" },
                //{ statistic: "minecraft:pot_flower" /* potFlower */, translate: "stat.minecraft.pot_flower", type: "int" },
                //{ statistic: "minecraft:player_kills" /* playerKills */, translate: "stat.minecraft.player_kills", type: "int" },
                //{ statistic: "minecraft:raid_trigger" /* raidTrigger */, translate: "stat.minecraft.raid_trigger", type: "int" },
                //{ statistic: "minecraft:raid_win" /* raidWin */, translate: "stat.minecraft.raid_win", type: "int" },
                //{ statistic: "minecraft:clean_shulker_box" /* cleanShulkerBox */, translate: "stat.minecraft.clean_shulker_box", type: "int" },
                //{ statistic: "minecraft:open_shulker_box" /* openShulkerBox */, translate: "stat.minecraft.open_shulker_box", type: "int" },
                //{ statistic: "minecraft:sneak_time" /* sneakTime */, translate: "stat.minecraft.sneak_time", type: "time" },
                //{ statistic: "minecraft:talked_to_villager" /* talkedToVillager */, translate: "stat.minecraft.talked_to_villager", type: "int" },
                //{ statistic: "minecraft:target_hit" /* targetHit */, translate: "stat.minecraft.target_hit", type: "int" },
                //{ statistic: "minecraft:play_time" /* playTime */, translate: "stat.minecraft.play_time", type: "time" },
                //{ statistic: "minecraft:time_since_death" /* timeSinceDeath */, translate: "stat.minecraft.time_since_death", type: "time" },
                //{ statistic: "minecraft:time_since_rest" /* timeSinceRest */, translate: "stat.minecraft.time_since_rest", type: "time" },
                //{ statistic: "minecraft:total_world_time" /* totalWorldTime */, translate: "stat.minecraft.total_world_time", type: "time" },
                //{ statistic: "minecraft:sleep_in_bed" /* sleepInBed */, translate: "stat.minecraft.sleep_in_bed", type: "int" },
                // { statistic: CustomStatistic.tradedWithVillager, translate: "stat.minecraft.traded_with_villager", type: "int" },
                //{ statistic: "minecraft:trigger_trapped_chest" /* triggerTrappedChest */, translate: "stat.minecraft.trigger_trapped_chest", type: "int" },
                //{ statistic: "minecraft:use_cauldron" /* useCauldron */, translate: "stat.minecraft.use_cauldron", type: "int" }
              ];

            // Show category selection menu
            const categoryForm = new ChestFormData('54')
                .title('Player Statistics')
                .button(0, '§l§4Back', [], 'textures/ui/arrow_l_default');

            // Add category buttons
            let slot = 10;

            for (const stat of customStats) {
                const value = playerStats.custom.getCustomStat(stat.statistic);
                const valueText = StatValueFormatter.formatStatValue(value, stat.type);                        

                categoryForm.button(
                    slot,
                    stat.translate,
                    [
                        `§7Value: §f${valueText}`,
                        '',
                        '§8' + stat.statistic
                    ],
                    stat.icon,
                    1
                );
                slot++;
            }

            const response = await categoryForm.show(player);

            if (response.canceled || response.selection === 0) {
                await this.showPlayerStats(player);
                return;
            }

        } catch (error) {
            Logger.log(`Error showing custom stats: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing statistics.');
        }
    }

    // Simplified method to display dynamic properties
    static async showDynamicProperties(player) {
        try {
            const properties = player.getDynamicPropertyIds();
            let currentPage = 0;
            const ITEMS_PER_PAGE = 45;
            const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

            while (true) {
                const startIndex = currentPage * ITEMS_PER_PAGE;
                const pageProperties = properties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                const propsForm = new ChestFormData('54')
                    .title(`Dynamic Properties - Page ${currentPage + 1}/${totalPages}`)
                    .button(0, '§l§4Back', ['', '§r§cReturn to Stats Overview'], 'textures/ui/arrow_l_default');

                // Add pagination buttons if needed
                if (currentPage > 0) {
                    propsForm.button(3, '§l§ePrevious Page', ['', `§r§ePage ${currentPage}/${totalPages}`], 'textures/ui/arrow_left');
                }
                if (currentPage < totalPages - 1) {
                    propsForm.button(5, '§l§eNext Page', ['', `§r§ePage ${currentPage + 2}/${totalPages}`], 'textures/ui/arrow_right');
                }

                // Add property buttons
                let slot = 9;
                for (const prop of pageProperties) {
                    const value = player.getDynamicProperty(prop);
                    propsForm.button(
                        slot,
                        prop,
                        [`§7Value: §f${value}`],
                        'textures/ui/debug_glyph_color',
                        1
                    );
                    slot++;
                }

                const response = await propsForm.show(player);

                // Handle form closure or back button
                if (response.canceled || response.selection === 0) {
                    await this.showPlayerStats(player);
                    return;
                }

                // Handle pagination
                if (response.selection === 3 && currentPage > 0) {
                    currentPage--;
                    continue;
                }
                if (response.selection === 5 && currentPage < totalPages - 1) {
                    currentPage++;
                    continue;
                }
            }

        } catch (error) {
            Logger.log(`Error showing dynamic properties: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing properties.');
            await this.showPlayerStats(player);
        }
    }

    static async showCollectionsMenu(player) {
        try {
            // Get active groups and completed collections
            const activeGroups = await CollectionGroupManager.getActiveGroupsForPlayer(player);
            const completedCollections = await CollectionHandler.getCompletedCollections(player);

            const menu = new ActionFormData()
                .title("Skychievments")
                .body("§7Select a category to view:\n");

            // Add buttons for active groups
            activeGroups.forEach(group => {
                menu.button(group.displayName, group.icon);
            });

            // Add completed collections button if player has any
            if (completedCollections.length > 0) {
                menu.button("Completed Quests", "textures/ui/check.png");
            }

            menu.button("Back to Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < activeGroups.length) {
                    await this.showGroupCollections(player, activeGroups[response.selection]);
                } else if (completedCollections.length > 0 && response.selection === activeGroups.length) {
                    await this.showCompletedCollections(player);
                }
                else {
                    await this.showMainMenu(player);
                }
            }
        } catch (error) {
            Logger.log(`Error in player main menu: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while opening the menu.');
        }
    }

    // Quests within selected group
    static async showGroupCollections(player, group) {
        try {
            const isEnabled = await CollectionGroupManager.isGroupEnabled(group.id);
            if (!isEnabled) {
                player.sendMessage('§cThis collection group is currently disabled.');
                await this.showMainMenu(player);
                return;
            }

            if (!CollectionGroupManager.isValidGroupId(group.id)) {
                Logger.log(`Invalid group ID: ${group.id}`, "ERROR", "PLAYER_UI");
                return;
            }

            // Get all collection data for this group in one check
            const { claimableCollections, progress } = await CollectionHandler.checkGroupProgress(player, group.id);

            // Get collections using new storage system
            const allCollections = CollectionStorage.getCollectionsByGroup(group.id)
                .filter(c => c.enabled)
                .sort((a, b) => a.order - b.order);

            // Create lookup map for claimable collections
            const claimableMap = new Map(
                claimableCollections.map(cc => [cc.collection.id, cc])
            );

            // Separate collections
            const uncompletedCollections = allCollections.filter(c => !progress[c.id]?.completed);
            const completedCollections = allCollections.filter(c => progress[c.id]?.completed);

            // Build the body text
            const completedText = completedCollections.length > 0 ?
                "\n§2§lCompleted:§r\n" + completedCollections
                    .map(c => `§7- ${c.displayName}`)
                    .join('\n') + '\n' : '';

            const menu = new ActionFormData()
                .title(`§p§r§e§f§i§x§r${group.displayName}`)
                .body(`${group.description}${completedText}\n`);

            // Add uncompleted collections as buttons
            if (uncompletedCollections.length > 0) {
                uncompletedCollections.forEach(collection => {
                    const collectionProgress = progress[collection.id];
                    const claimableData = claimableMap.get(collection.id);

                    // Build progress text for each requirement
                    const progressText = collection.requirements
                        .map((req, index) => {
                            const current = collectionProgress?.requirements[index]?.amount || 0;
                            return `\n${claimableData ? '§2' : '§6'}${current}/${req.amount} ${req.itemId.split(':')[1]}`;
                        })
                        .join('');

                    menu.button(
                        `${claimableData ? '§q[*] ' : ''}${collection.displayName}`,
                        collection.icon
                    );
                });
            } else {
                menu.button("§cNo Active Collections\n§8All collections completed!");
            }

            menu.button("Back to Menu", "textures/ui/imagelesshoverbg.png");

            const response = await menu.show(player);

            if (response.canceled) return;

            const lastButtonIndex = uncompletedCollections.length > 0 ? uncompletedCollections.length : 1;

            if (response.selection === lastButtonIndex) {
                await this.showCollectionsMenu(player);
                return;
            }

            if (uncompletedCollections.length > 0) {
                const selectedCollection = uncompletedCollections[response.selection];
                const claimableData = claimableMap.get(selectedCollection.id);
                await this.showCollectionDetails(player, selectedCollection, claimableData, progress);
            }

        } catch (error) {
            Logger.log(`Error showing group collections: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collections.');
        }
    }

    // selected Quest Details
    static async showCollectionDetails(player, collection, claimableData, progress) {
        try {
            // // Build requirements text using progress data
            // const requirementsText = collection.requirements.map((req, index) => {
            //     const current = claimableData?.requirements[index]?.amount || 0;
            //     return `§7${req.itemId.split(':')[1]}: ${claimableData ? '§q' : '§f'}${current}/${req.amount}`;
            // }).join('\n');

            // Get the current collection's progress
            const collectionProgress = progress[collection.id] || { requirements: [] };

            // Build requirements text using progress data
            const requirementsText = collection.requirements.map((req, index) => {
                const current = collectionProgress.requirements[index]?.amount || 0;
                const progressColor = current >= req.amount ? '§a' : '§6';
                return `${progressColor}${current}§7/${req.amount} ${req.itemId.split(':')[1].replace(/_/g, ' ')}`;
            }).join('\n');

            // Build rewards text
            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new ActionFormData()
                .title(`§q§u§e§s§t§r${collection.displayName}`)
                // .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Requirements:\n${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}`
                );

            if (claimableData) {
                menu.button("Claim", "textures/ui/check.png");
            }
            menu.button("Back", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (response.canceled) return;

            if (response.selection === 0 && claimableData) {
                const result = await CollectionHandler.claimCollection(player, claimableData);
                player.sendMessage(result.message);
                if (result.success) {
                    await this.showGroupCollections(player, CollectionGroupManager.getGroupById(collection.parentId));
                } else {
                    await this.showCollectionDetails(player, collection, claimableData);
                }
            } else {
                const group = CollectionGroupManager.getGroupById(collection.parentId);
                if (group) {
                    await this.showGroupCollections(player, group);
                } else {
                    Logger.log(`Group not found for collection ${collection.id}`, "ERROR", "PLAYER_UI");
                    await this.showCollectionsMenu(player);
                }
            }
        } catch (error) {
            Logger.log(`Error showing collection details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing collection details.');
        }
    }

    // Show groups with completed collections
    static async showCompletedCollections(player) {
        try {
            // Get all completed collections data
            const completedCollections = await CollectionHandler.getCompletedCollections(player);
            if (completedCollections.length === 0) {
                player.sendMessage('§cNo completed collections found.');
                await this.showMainMenu(player);
                return;
            }

            // Get all collections from storage and organize by groups
            const groupedCollections = new Map();

            // Sort and group completed collections by their parent groups
            for (const completed of completedCollections) {
                const collection = CollectionStorage.getCollection(completed.id);
                if (!collection) continue;

                if (!groupedCollections.has(collection.parentId)) {
                    groupedCollections.set(collection.parentId, []);
                }
                groupedCollections.get(collection.parentId).push({
                    ...collection,
                    completedAt: completed.completedAt
                });
            }

            // Create menu with group selection
            const menu = new ActionFormData()
                .title("Completed Collections")
                .body(`§7Your completed collections:\n`);

            // Process groups with completions
            const groupsWithCompletions = [];
            for (const [groupId, collections] of groupedCollections) {
                const group = CollectionGroupManager.getGroupById(groupId);
                if (!group) continue;

                groupsWithCompletions.push({
                    group,
                    collections: collections.sort((a, b) => a.order - b.order)
                });
            }

            // Sort groups by their configured order
            groupsWithCompletions.sort((a, b) => a.group.order - b.group.order);

            // Add menu buttons for each group
            groupsWithCompletions.forEach(({ group }) => {
                menu.button(group.displayName, group.icon);
            });

            menu.button("Back to Menu", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < groupsWithCompletions.length) {
                    const selectedGroup = groupsWithCompletions[response.selection];
                    await this.showCompletedGroupDetails(
                        player,
                        selectedGroup.group,
                        selectedGroup.collections
                    );
                } else {
                    await this.showCollectionsMenu(player);
                }
            }

        } catch (error) {
            Logger.log(`Error showing completed collections: ${error}`, "ERROR", "PLAYER_UI");
            await this.showMainMenu(player);
        }
    }

    // show completed collections within selected group
    static async showCompletedGroupDetails(player, group, completedCollections) {
        try {
            const menu = new ActionFormData()
                .title(group.displayName)
                .body(`§7View your completed achievements:\n`);

            // Sort collections by completion date, newest first
            const sortedCollections = completedCollections
                .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

            sortedCollections.forEach(collection => {
                menu.button(collection.displayName, collection.icon);
            });

            menu.button("Back to Categories", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                if (response.selection < sortedCollections.length) {
                    await this.showCompletedCollectionDetails(
                        player,
                        sortedCollections[response.selection]
                    );
                } else {
                    await this.showCompletedCollections(player);
                }
            }

        } catch (error) {
            Logger.log(`Error showing completed group details: ${error}`, "ERROR", "PLAYER_UI");
            await this.showCompletedCollections(player);
        }
    }

    //show selected quest details
    static async showCompletedCollectionDetails(player, collection) {
        try {
            const requirementsText = collection.requirements
                .map(req => `§7- ${req.amount}x ${req.itemId.split(':')[1]}`)
                .join('\n');

            const rewardsText = collection.rewards
                .map(r => `§7- ${r.displayText}`)
                .join('\n');

            const menu = new ActionFormData()
                .title(collection.displayName)
                .body(
                    `${collection.description}\n\n` +
                    `§7Requirements:\n${requirementsText}\n\n` +
                    `§7Rewards:\n${rewardsText}\n\n` +
                    `§7Completed: §a✔`
                )
                .button("Back to Collections", "textures/ui/arrow_dark_left_stretch.png");

            const response = await menu.show(player);

            if (!response.canceled) {
                await this.showCompletedGroupDetails(
                    player,
                    CollectionGroupManager.getGroupById(collection.parentId),
                    (await CollectionHandler.getCompletedCollections(player))
                        .map(c => {
                            const col = CollectionStorage.getCollection(c.id);
                            return col ? { ...col, completedAt: c.completedAt } : null;
                        })
                        .filter(c => c && c.parentId === collection.parentId)
                );
            }

        } catch (error) {
            Logger.log(`Error showing completed collection details: ${error}`, "ERROR", "PLAYER_UI");
            await this.showCompletedCollections(player);
        }
    }

    static async showMilestonesMenu(player) {
        try {
            const allMilestones = Object.values(MILESTONES).flat();

            // Filter out hidden milestones
            const visibleMilestones = allMilestones.filter(milestone => !milestone.isHidden);
            
            const menu = new ChestFormData('90')
                .title('MileStones')
                //.background("chestUI_90-NUmbers.png")
                .button(81, '§l§4Back', [], 'textures/ui/QuestIcons/back', 50, 50)
                .button(89, '§l§6Refresh Milestones', [], 'textures/ui/refresh_light');

            let slot = 10;
            for (const milestone of visibleMilestones) {
            
                // is the milestone active 
                const isActivated = await MilestoneHandler.isActivated(player, milestone.id);

                // Skip non-activated milestones in display (unless they have no activation requirements)
                if (!isActivated && milestone.options?.activatedBy?.length > 0) {
                    continue;
                }

                // get players progress for the milestone
                const progress = await MilestoneHandler.getPlayerProgress(player, milestone.id);                
                // have the prereqs been met
                const prereqsMet = await MilestoneHandler.checkPrerequisitesEfficient(player, milestone, progress);

                const currentTier = milestone.collections.find(c => c.tier === progress.currentTier);

                // Calculate overall tier progress based on all requirements
                const requirementProgress = currentTier.requirements.map(requirement => {
                    const requirementProgress = progress.requirements.find(r => r.itemId === requirement.itemId);
                    return {
                        current: requirementProgress?.currentCount || 0,
                        target: requirement.amount,
                        type: requirement.type,
                        itemId: requirement.itemId,
                        percentage: Math.min(100, (requirementProgress?.currentCount || 0) / requirement.amount * 100)
                    };
                });

                //const requirement = currentTier.requirements[0];

                // Use the stored count from milestone progress
                //const currentProgress = progress.currentCount;

                // Calculate percentage for progress bar
                //const percentage = Math.min(100, (currentProgress / requirement.amount) * 100);
                //const progressBar = this.createProgressBar(percentage);

                // Calculate overall percentage as average of all requirements
                const overallPercentage = requirementProgress.reduce((sum, req) => sum + req.percentage, 0) / requirementProgress.length;
                const progressBar = this.createProgressBar(overallPercentage);

                let displayStatus = prereqsMet ? '§7In Progress' : '§c Prerequisites Required';
                if (progress.completed) {
                    if (milestone.options?.repeatable?.enabled) {
                        const cooldownMinutes = milestone.options.repeatable.cooldown;
                        const timeSinceCompletion = (Date.now() - progress.lastCompleted) / (1000 * 60);
                        if (timeSinceCompletion < cooldownMinutes) {
                            displayStatus = `§eCooldown: ${Math.ceil(cooldownMinutes - timeSinceCompletion)}m`;
                        } else {
                            displayStatus = '§aReady to Repeat';
                        }
                    } else {
                        displayStatus = '§a✔ Completed';
                    }
                }

                const loreLines = [
                    `§7${milestone.description}`,
                    '',
                    `§7Status: ${displayStatus}`
                ];

                if (!prereqsMet && milestone.options?.prerequisites) {
                    loreLines.push(
                        '',
                        '§cPrerequisites Required:'
                    );
                    // Get display names for all prerequisites
                    for (const prereq of milestone.options.prerequisites) {
                        const displayName = await this.getPrerequisiteDisplayName(prereq.id);
                        loreLines.push(`§7- ${displayName}`);
                    }
                }

                if (prereqsMet && (!progress.completed || milestone.options?.repeatable?.enabled)) {
                    loreLines.push(
                        '',
                        `§7Current Tier: §f${currentTier.displayName}`,
                        '',
                        '§7Overall Progress:',
                        progressBar,
                        '',
                        '§7Requirements Progress:'
                    );
    
                    // Add individual requirement progress
                    for (let i = 0; i < currentTier.requirements.length; i++) {
                        const requirement = currentTier.requirements[i];
                        const requirementProgress = progress.requirements[i];
                        const { current, target, percentage, displayName } = this.getRequirementProgress(requirementProgress, requirement);
                        
                        loreLines.push(
                            `§7${displayName}:`,
                            `§7${current}§7/§f${target}`,
                            this.createProgressBar(percentage)                            
                        );

                        if (i < currentTier.requirements.length - 1) {
                            loreLines.push('');
                        }
                    }                        
                }

                loreLines.push(
                    '',
                    `§7Total Tiers: §f${milestone.collections.length}`,
                    milestone.options?.repeatable?.enabled ? '§6↻ Repeatable' : ''
                );

                menu.button(
                    milestone.slot,
                    `${progress.completed ? '§a' : prereqsMet ? '§f' : '§c'}${milestone.displayName}`,
                    loreLines,
                    milestone.icon,
                    1
                );
                slot++;
            }


            const response = await menu.show(player);

            if (response.canceled || response.selection === 0) {
                await this.showMainMenu(player);
                return;
            }

            if (response.selection === 3) {                                    
                await MilestoneHandler.checkAllActiveMilestones(player);
            }

            // Show details for selected milestone
            if (response.selection !== 0 && response.selection !== 3) {
                // Find the milestone that uses this slot
                const selectedMilestone = visibleMilestones.find(m => m.slot === response.selection);
                if (selectedMilestone) {
                    await this.showMilestoneDetails(player, selectedMilestone);
                }
            }
            

        } catch (error) {
            Logger.log(`Error in milestones menu: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing milestones.');
        }
    }

    static async showMilestoneDetails(player, milestone) {
        try {
            // Get the complete milestone progress data for this player
            const progress = await MilestoneHandler.getPlayerProgress(player, milestone.id);
            const prereqsMet = await MilestoneHandler.checkPrerequisitesEfficient(player, milestone, progress);

            const menu = new ChestFormData('90')               
                .title(milestone.displayName)
                .background(milestone.background)
                //.title(milestone.displayName)                  
                .button(0, '§l§4Back', [], 'textures/ui/QuestIcons/back');

            // If there are prerequisites, show them at the top of the details
            if (milestone.options?.prerequisites?.length > 0) {
                const prereqLines = [
                    '§7Prerequisites:',
                    ''
                ];

                for (const prereq of milestone.options.prerequisites) {
                    const displayName = await this.getPrerequisiteDisplayName(prereq.id);
                    const prereqProgress = await CollectionHandler.isCollectionCompleted(player, prereq.id);
                    prereqLines.push(`${prereqProgress ? '§a✔' : '§c✘'} §7${displayName}`);
                }

                menu.button(
                    4,
                    prereqsMet ? '§aPrerequisites Complete' : '§cPrerequisites Required',
                    prereqLines,
                    prereqsMet ? 'textures/ui/check' : 'textures/ui/cancel',
                    1
                );
            }

            //let slot = 10;
            for (const collection of milestone.collections) {                
                const isCurrentTier = collection.tier === progress.currentTier;
                const isCompletedTier = collection.tier < progress.currentTier || progress.completed;
                //const slotOffset = collection.slotOffset ?? 0;

                // Handle milestone reference type 
            if (collection.type === 'milestone_reference') {
                const refData = collection.reference;
                const referencedMilestone = MilestoneStorage.getMilestone(refData.milestoneId);
                
                if (referencedMilestone) {
                    const isActivated = await MilestoneHandler.isActivated(player, refData.milestoneId);
                    const refProgress = await MilestoneHandler.getPlayerProgress(player, refData.milestoneId);
                    
                    // Customize lore for referenced milestones
                    const loreLines = [
                        `§7${collection.description}`,
                        '',
                        `§7Unlocks: §f${referencedMilestone.displayName}`,                        
                        ''
                    ];
                    
                    // Show reference milestone progress if activated
                    if (isActivated) {
                        const completedTiers = refProgress.currentTier - 1 + (refProgress.completed ? 1 : 0);
                        const totalTiers = referencedMilestone.collections.length;
                        const refPercentage = (completedTiers / totalTiers) * 100;
                        
                        loreLines.push(
                            `§7Progress: §f${completedTiers}/${totalTiers} tiers`,
                            this.createProgressBar(refPercentage),
                            '',
                            `§7Status: ${refProgress.completed ? '§a Completed' : '§6 In Progress'}`
                        );
                        
                        if (isCurrentTier && refData.mode === 'sequential' && !refProgress.completed) {
                            loreLines.push(
                                '',
                                '§c Complete this side quest to continue'
                            );
                        }
                    }                     
                    // Add navigation hint
                    loreLines.push(
                        '',
                        '§7Click to view detailed progress'
                    );
                                       

                    // Show status indicator
                    if (isCompletedTier) {
                        loreLines.push('', '§a Activated');
                    } else if (isCurrentTier) {
                        if (prereqsMet) {
                            loreLines.push('', '§6 Ready to Start');
                        } else {
                            loreLines.push('', '§c Prerequisites Required');
                        }
                    } else {
                        loreLines.push('', '§7Locked');
                    }
                    
                    menu.button(
                        collection.slot,
                        `${isCompletedTier ? '§a' : isCurrentTier ? '§6' : '§7'}${collection.displayName}`,
                        loreLines,
                        isCompletedTier ? 'textures/ui/check' : collection.icon,
                        1
                    );
                } else {
                    // Handle case where referenced milestone doesn't exist
                    menu.button(
                        collection.slot,
                        `§c${collection.displayName}`,
                        [
                            '§cError: Referenced milestone not found',
                            `§8ID: ${refData.milestoneId}`
                        ],
                        'textures/ui/error',
                        1
                    );
                }
            } else 
            { 
                const loreLines = [
                    `§7${collection.description}`,
                    ''
                ];

                if (isCurrentTier) {
                    loreLines.push('§7Requirements:');
                    
                    // Show each requirement's progress
                    collection.requirements.forEach((requirement, index) => {
                        const requirementProgress = progress.requirements[index];
                        const { current, target, percentage, displayName } = this.getRequirementProgress(requirementProgress, requirement);

                        loreLines.push(
                            `§7${displayName}:`,
                            `§7${current}§7/§f${target}`,
                            this.createProgressBar(percentage),
                            ''
                        );
                    });
                    
                    // If prerequisites aren't met, show warning
                    if (!prereqsMet) {
                        loreLines.push(
                            '§c⚠ Progress Blocked',
                            '§7Complete prerequisites first!',
                            ''
                        );
                    }
                }

                // Show rewards
                loreLines.push('§7Rewards:');
                collection.rewards.forEach(reward => {
                    if (reward.type === 'point') {
                        loreLines.push(`§7- §f${reward.amount} points`);
                    } else if (reward.type === 'command') {
                        loreLines.push(`§7- §f${reward.command}`);
                    }
                });

                // Show status indicator
                if (isCompletedTier) {
                    loreLines.push('', '§a Completed');
                } else if (isCurrentTier) {
                    if (prereqsMet) {
                        loreLines.push('', '§6 In Progress');
                    } else {
                        loreLines.push('', '§c Prerequisites Required');
                    }
                } else {
                    loreLines.push('', '§7Locked');
                }

                menu.button(
                    collection.slot,
                    `${isCompletedTier ? '§a' : isCurrentTier ? '§6' : '§7'}${collection.displayName}`,
                    loreLines,
                    isCompletedTier ? 'textures/ui/check' : collection.icon,
                    1
                );
                //slot++;
            }

            }

            const response = await menu.show(player);

            if (response.canceled || response.selection === 0) {
                await this.showMilestonesMenu(player);
                return;
            }

            // Handle clicks on milestone references to navigate to those milestones
            const selectedSlot = response.selection;
            const selectedCollection = milestone.collections.find(c => c.slot === selectedSlot);

            if (selectedCollection && selectedCollection.type === 'milestone_reference') {
                const referencedMilestone = MilestoneStorage.getMilestone(selectedCollection.reference.milestoneId);
                if (referencedMilestone) {
                    // Navigate to the referenced milestone details
                    await this.showMilestoneDetails(player, referencedMilestone);
                    return;
                }
            }

        } catch (error) {
            Logger.log(`Error showing milestone details: ${error}`, "ERROR", "PLAYER_UI");
            player.sendMessage('§cAn error occurred while showing milestone details.');
        }
    }

    static getRequirementDisplayName(requirement) {
        switch (requirement.type) {
            case 'walk':
                return 'Distance Walked';
            case 'anyBlock':
                return 'Any Block Broken';
            case 'anyMob':
                return 'Any Mob Killed';
            default:
                // For specific items/blocks, clean up the minecraft:item_name format
                return requirement.itemId ? requirement.itemId.split(':')[1].replace(/_/g, ' ') : requirement.type;
        }
    }
    
    static getRequirementProgress(requirementProgress, requirement) {
        const currentCount = requirementProgress?.currentCount || 0;
        const percentage = Math.min(100, (currentCount / requirement.amount) * 100);
        const formattedCurrentCount = StatValueFormatter.formatStatValue(currentCount, requirement.type);
        const formattedTargetAmount = StatValueFormatter.formatStatValue(requirement.amount, requirement.type);
    
        return {
            current: formattedCurrentCount,
            target: formattedTargetAmount,
            percentage,
            displayName: this.getRequirementDisplayName(requirement)
        };
    }

    static async getPrerequisiteDisplayName(prereqId) {
        // First check if it's a collection
        const collection = CollectionStorage.getCollection(prereqId);
        if (collection) {
            return collection.displayName;
        }

        // If not a collection, check if it's a milestone
        const milestone = MilestoneStorage.getMilestone(prereqId);
        if (milestone) {
            return milestone.displayName;
        }

        // If not found, return the ID as fallback
        return prereqId;
    }

    static createProgressBar(percentage) {
        const barLength = 20;
        const filledBars = Math.floor((percentage / 100) * barLength);
        const emptyBars = barLength - filledBars;
        return '§a' + '■'.repeat(filledBars) + '§7' + '■'.repeat(emptyBars);
    }
}
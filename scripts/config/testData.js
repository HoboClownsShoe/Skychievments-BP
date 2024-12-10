import { AVAILABLE_BLOCKS } from './categorizedItems.js';
import { COLLECTION_GROUPS, CollectionGroupManager } from './collectionGroups.js';
import { world } from '@minecraft/server';
import { CollectionManager } from './collections.js';
import { Logger } from '../utils/logger.js';


// Test group definition to be added to COLLECTION_GROUPS
export const TEST_GROUP = {
    id: "group_test",
    name: "Test",
    displayName: "Test Collections",
    description: "§7A group of test collections with random requirements and rewards",
    icon: "textures/ui/debug_screen.png",
    order: 999,
    enabled: true,
    settings: {
        maxCollectionsPerGroup: 150 // Allow plenty of room for test collections
    }
};

// Generate test collections
export const TEST_COLLECTIONS = {
    "group_test": [
        ...[...Array(25)].map((_, i) => {
            // Generate 1-3 random requirements
            const requirements = [...Array(Math.floor(Math.random() * 3) + 1)].map(() => ({
                itemId: AVAILABLE_BLOCKS[Math.floor(Math.random() * AVAILABLE_BLOCKS.length)],
                amount: Math.floor(Math.random() * 128) + 16 // Random amount between 16-144
            }));

            // Generate 1-3 random rewards
            const rewards = [
                // Item reward with potential enchantments
                {
                    type: "item",
                    itemId: AVAILABLE_BLOCKS[Math.floor(Math.random() * AVAILABLE_BLOCKS.length)],
                    amount: Math.floor(Math.random() * 16) + 1,
                    displayText: "Random Item Reward",
                    enchantments: Math.random() > 0.7 ? [ // 30% chance of enchantments
                        {
                            id: [
                                "minecraft:sharpness", "minecraft:smite", "minecraft:bane_of_arthropods",
                                "minecraft:efficiency", "minecraft:unbreaking", "minecraft:fortune",
                                "minecraft:power", "minecraft:punch", "minecraft:flame",
                                "minecraft:infinity", "minecraft:protection", "minecraft:fire_protection",
                                "minecraft:blast_protection", "minecraft:projectile_protection",
                                "minecraft:feather_falling", "minecraft:thorns", "minecraft:depth_strider",
                                "minecraft:respiration", "minecraft:aqua_affinity", "minecraft:looting",
                                "minecraft:silk_touch", "minecraft:luck_of_the_sea", "minecraft:lure",
                                "minecraft:frost_walker", "minecraft:mending", "minecraft:binding",
                                "minecraft:vanishing", "minecraft:impaling", "minecraft:riptide",
                                "minecraft:loyalty", "minecraft:channeling"
                            ][Math.floor(Math.random() * 31)],
                            level: Math.floor(Math.random() * 5) + 1
                        }
                    ] : undefined
                },
                // Additional random item reward
                {
                    type: "item",
                    itemId: AVAILABLE_BLOCKS[Math.floor(Math.random() * AVAILABLE_BLOCKS.length)],
                    amount: Math.floor(Math.random() * 32) + 1,
                    displayText: "Bonus Random Reward"
                },
                // Effect command reward
                {
                    type: "command",
                    command: [
                        "effect @p speed 600 2",
                        "effect @p haste 600 2",
                        "effect @p strength 300 1",
                        "effect @p jump_boost 300 2",
                        "effect @p regeneration 300 2",
                        "effect @p resistance 300 1",
                        "effect @p fire_resistance 600 1",
                        "effect @p water_breathing 600 1",
                        "effect @p invisibility 300 1",
                        "effect @p night_vision 600 1",
                        "effect @p health_boost 600 2",
                        "effect @p absorption 300 2",
                        "effect @p saturation 300 1",
                        "effect @p slow_falling 300 1",
                        "effect @p conduit_power 600 1",
                        "effect @p dolphins_grace 300 1"
                    ][Math.floor(Math.random() * 16)],
                    displayText: "Random Effect Reward"
                }
            ];

            // Remove some rewards randomly to vary reward count
            if (Math.random() > 0.7) {
                rewards.pop(); // 30% chance to have only 2 rewards
            }

            return {
                id: `test_collection_${(i + 1).toString().padStart(3, '0')}`,
                parentId: "group_test",
                displayName: `Test Collection ${i + 1}`,
                description: `A randomly generated test collection with ${requirements.length} requirement(s) and ${rewards.length} reward(s).`,
                icon: "textures/ui/debug_screen.png",
                requirements,
                rewards,
                enabled: Math.random() > 0.1, // 90% chance of being enabled
                order: i
            };
        })
    ]
};

export async function loadTestCollections() {
    try {
        Logger.log("Starting test collections load process", "DEBUG", "TEST_DATA");

        // Step 1: Ensure test group exists in COLLECTION_GROUPS
        const existingGroupIndex = COLLECTION_GROUPS.findIndex(g => g.id === "group_test");
        if (existingGroupIndex === -1) {
            COLLECTION_GROUPS.push(TEST_GROUP);
            Logger.log("Added test group to COLLECTION_GROUPS", "DEBUG", "TEST_DATA");
        } else {
            // Update existing group settings if needed
            COLLECTION_GROUPS[existingGroupIndex] = TEST_GROUP;
            Logger.log("Updated existing test group", "DEBUG", "TEST_DATA");
        }

        // Step 2: Enable the test group
        await CollectionGroupManager.setGroupState("group_test", true);
        Logger.log("Enabled test group", "DEBUG", "TEST_DATA");

        // Step 3: Set the collections for the test group
        const groupKey = `sk_collections_group_${TEST_GROUP.id}`;
        const collections = TEST_COLLECTIONS[TEST_GROUP.id];
        world.setDynamicProperty(groupKey, JSON.stringify(collections));
        Logger.log(`Saved ${collections.length} test collections to storage`, "DEBUG", "TEST_DATA");

        // Step 4: Force reload collections cache
        await CollectionManager.loadCollections("group_test");
        Logger.log("Reloaded collections cache", "DEBUG", "TEST_DATA");

        // Generate result statistics
        const result = {
            success: true,
            totalCollections: collections.length,
            enabledCollections: collections.filter(c => c.enabled).length,
            requirements: {
                min: Math.min(...collections.map(c => c.requirements.length)),
                max: Math.max(...collections.map(c => c.requirements.length)),
                total: collections.reduce((sum, c) => sum + c.requirements.length, 0)
            },
            rewards: {
                min: Math.min(...collections.map(c => c.rewards.length)),
                max: Math.max(...collections.map(c => c.rewards.length)),
                total: collections.reduce((sum, c) => sum + c.rewards.length, 0)
            }
        };

        Logger.log(`Test collections load completed: ${JSON.stringify(result)}`, "DEBUG", "TEST_DATA");
        return result;

    } catch (error) {
        Logger.log(`Error loading test collections: ${error}`, "ERROR", "TEST_DATA");
        return {
            success: false,
            error: error.message
        };
    }
}
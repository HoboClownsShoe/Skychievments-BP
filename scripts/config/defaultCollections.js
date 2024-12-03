// scripts/config/defaultCollections.js
export const DEFAULT_COLLECTIONS = {
    // Mining group collections
    "group_mining": [
        {
            "id": "cobblestone_1",
            "parentId": "group_mining",
            "displayName": "§8Stone Age Begins",
            "description": "Your first stepping stone to success! Gather basic building materials.",
            "icon": "textures/ui/mining_icon.png",
            "requirements": [
                {
                    "itemId": "minecraft:cobblestone",
                    "amount": 64
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:stone_pickaxe",
                    "amount": 1,
                    "displayText": "1x Stone Pickaxe"
                },
                {
                    "type": "command",
                    "command": "effect @p haste 300 1",
                    "displayText": "Haste I Effect (5 minutes)"
                }
            ],
            "enabled": true,
            "order": 0
        },
        {
            "id": "coal_mining_1",
            "parentId": "group_mining",
            "displayName": "§8Coal Hunter",
            "description": "Begin your journey into resource gathering with coal.",
            "icon": "textures/blocks/coal_ore.png",
            "requirements": [
                {
                    "itemId": "minecraft:coal",
                    "amount": 32
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:torch",
                    "amount": 32,
                    "displayText": "32x Torches"
                },
                {
                    "type": "item",
                    "itemId": "minecraft:coal_block",
                    "amount": 1,
                    "displayText": "1x Block of Coal"
                }
            ],
            "enabled": true,
            "order": 1
        }
    ],

    // Farming group collections
    "group_farming": [
        {
            "id": "wheat_farming_1",
            "parentId": "group_farming",
            "displayName": "§2Beginning Farmer",
            "description": "Start your farming journey with wheat cultivation.",
            "icon": "textures/items/wheat.png",
            "requirements": [
                {
                    "itemId": "minecraft:wheat",
                    "amount": 64
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:bread",
                    "amount": 16,
                    "displayText": "16x Bread"
                },
                {
                    "type": "item",
                    "itemId": "minecraft:bone_meal",
                    "amount": 16,
                    "displayText": "16x Bone Meal"
                }
            ],
            "enabled": true,
            "order": 0
        },
        {
            "id": "carrot_farming_1",
            "parentId": "group_farming",
            "displayName": "§2Carrot Collector",
            "description": "Expand your farm with nutritious carrots.",
            "icon": "textures/items/carrot.png",
            "requirements": [
                {
                    "itemId": "minecraft:carrot",
                    "amount": 64
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:golden_carrot",
                    "amount": 8,
                    "displayText": "8x Golden Carrots"
                },
                {
                    "type": "command",
                    "command": "effect @p night_vision 600 0",
                    "displayText": "Night Vision (10 minutes)"
                }
            ],
            "enabled": true,
            "order": 1
        }
    ],

    // Tools group collections
    "group_tools": [
        {
            "id": "basic_tools_1",
            "parentId": "group_tools",
            "displayName": "§6Tool Collector I",
            "description": "Craft your first set of basic tools.",
            "icon": "textures/items/wood_pickaxe.png",
            "requirements": [
                {
                    "itemId": "minecraft:wooden_pickaxe",
                    "amount": 1
                },
                {
                    "itemId": "minecraft:wooden_axe",
                    "amount": 1
                },
                {
                    "itemId": "minecraft:wooden_shovel",
                    "amount": 1
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:stone_pickaxe",
                    "amount": 1,
                    "displayText": "1x Stone Pickaxe"
                },
                {
                    "type": "item",
                    "itemId": "minecraft:stone_axe",
                    "amount": 1,
                    "displayText": "1x Stone Axe"
                },
                {
                    "type": "item",
                    "itemId": "minecraft:stone_shovel",
                    "amount": 1,
                    "displayText": "1x Stone Shovel"
                }
            ],
            "enabled": true,
            "order": 0
        }
    ],

    // Combat group collections
    "group_combat": [
        {
            "id": "zombie_hunter_1",
            "parentId": "group_combat",
            "displayName": "§cZombie Hunter I",
            "description": "Begin your combat training by collecting zombie drops.",
            "icon": "textures/items/rotten_flesh.png",
            "requirements": [
                {
                    "itemId": "minecraft:rotten_flesh",
                    "amount": 64
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:iron_sword",
                    "amount": 1,
                    "displayText": "1x Iron Sword"
                },
                {
                    "type": "command",
                    "command": "effect @p strength 300 0",
                    "displayText": "Strength I (5 minutes)"
                }
            ],
            "enabled": true,
            "order": 0
        }
    ],

    // Technology group collections
    "group_technology": [
        {
            "id": "redstone_basics_1",
            "parentId": "group_technology",
            "displayName": "§4Redstone Beginner",
            "description": "Start your journey into redstone technology.",
            "icon": "textures/items/redstone_dust.png",
            "requirements": [
                {
                    "itemId": "minecraft:redstone",
                    "amount": 32
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:repeater",
                    "amount": 4,
                    "displayText": "4x Redstone Repeater"
                },
                {
                    "type": "item",
                    "itemId": "minecraft:piston",
                    "amount": 2,
                    "displayText": "2x Piston"
                }
            ],
            "enabled": true,
            "order": 0
        }
    ],

    // Fishing group collections
    "group_fishing": [
        {
            "id": "fishing_starter_1",
            "parentId": "group_fishing",
            "displayName": "§bFishing Beginner",
            "description": "Begin your fishing adventure!",
            "icon": "textures/items/fish_raw.png",
            "requirements": [
                {
                    "itemId": "minecraft:cod",
                    "amount": 16
                }
            ],
            "rewards": [
                {
                    "type": "item",
                    "itemId": "minecraft:fishing_rod",
                    "amount": 1,
                    "displayText": "1x Fishing Rod (Enchanted)",
                    "enchantments": [
                        {
                            "id": "minecraft:luck_of_the_sea",
                            "level": 1
                        }
                    ]
                }
            ],
            "enabled": true,
            "order": 0
        }
    ]
};

// Helper function to get collections for a specific group
export function getDefaultCollectionsForGroup(groupId) {
    return DEFAULT_COLLECTIONS[groupId] || [];
}

// Helper function to validate collection data
export function validateDefaultCollections() {
    let isValid = true;
    const errors = [];

    for (const [groupId, collections] of Object.entries(DEFAULT_COLLECTIONS)) {
        // Check each collection in the group
        collections.forEach(collection => {
            if (!collection.id || !collection.parentId || !collection.displayName) {
                errors.push(`Invalid collection in group ${groupId}: Missing required fields`);
                isValid = false;
            }

            if (collection.parentId !== groupId) {
                errors.push(`Collection ${collection.id} has mismatched parentId (${collection.parentId}) for group ${groupId}`);
                isValid = false;
            }

            // Validate requirements
            if (!Array.isArray(collection.requirements) || collection.requirements.length === 0) {
                errors.push(`Collection ${collection.id} has invalid requirements`);
                isValid = false;
            }

            // Validate rewards
            if (!Array.isArray(collection.rewards) || collection.rewards.length === 0) {
                errors.push(`Collection ${collection.id} has invalid rewards`);
                isValid = false;
            }
        });
    }

    return { isValid, errors };
}

// Helper function to get total collection count
export function getTotalDefaultCollections() {
    return Object.values(DEFAULT_COLLECTIONS)
        .reduce((total, collections) => total + collections.length, 0);
}
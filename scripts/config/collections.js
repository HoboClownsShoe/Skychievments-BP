export const DEFAULT_COLLECTIONS = {
    // Mining group collections
    "group_mining": [
        {
            "id": "cobblestone_1",
            "parentId": "group_mining",
            "displayName": "Stone Age Begins",
            "description": "Your first stepping stone to success! Gather basic building materials.",
            "icon": "textures/ui/mining_icon.png",
            "requirements": [
                {
                    "type": "collect", 
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
            "displayName": "Coal Hunter",
            "description": "Begin your journey into resource gathering with coal.",
            "icon": "textures/blocks/coal_ore.png",
            "requirements": [
                {
                    "type": "collect",
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
            "displayName": "Beginning Farmer",
            "description": "Start your farming journey with wheat cultivation.",
            "icon": "textures/items/wheat.png",
            "requirements": [
                {
                    "type": "collect",
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
            "displayName": "Carrot Collector",
            "description": "Expand your farm with nutritious carrots.",
            "icon": "textures/items/carrot.png",
            "requirements": [
                {
                    "type": "collect",
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
            "displayName": "Tool Collector I",
            "description": "Craft your first set of basic tools.",
            "icon": "textures/items/wood_pickaxe.png",
            "requirements": [
                {
                    "type": "collect",
                    "itemId": "minecraft:wooden_pickaxe",
                    "amount": 1
                },
                {
                    "type": "collect",
                    "itemId": "minecraft:wooden_axe",
                    "amount": 1
                },
                {
                    "type": "collect",
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
            "displayName": "Zombie Hunter I",
            "description": "Begin your combat training by collecting zombie drops.",
            "icon": "textures/items/rotten_flesh.png",
            "requirements": [
                {
                    "type": "collect",
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
            "displayName": "Redstone Beginner",
            "description": "Start your journey into redstone technology.",
            "icon": "textures/items/redstone_dust.png",
            "requirements": [
                {
                    "type": "collect",
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
    "xxx_group_fishing": [
        {
            "id": "fishing_starter_1",
            "parentId": "group_fishing",
            "displayName": "Fishing Beginner",
            "description": "Begin your fishing adventure!",
            "icon": "textures/items/fish_raw.png",
            "requirements": [
                {
                    "type": "collect",
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

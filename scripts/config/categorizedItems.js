// scripts/config/itemCategories.js

export const CREATIVE_CATEGORIES = {
    buildingBlocks: {
        name: "Building Blocks",
        icon: "textures/blocks/brick.png",
        description: "§8Basic building materials",
        items: [
            {
                id: "minecraft:stone",
                texture: "textures/blocks/stone.png",
                name: "Stone"
            },
            {
                id: "minecraft:cobblestone",
                texture: "textures/blocks/cobblestone.png",
                name: "Cobblestone"
            },
            {
                id: "minecraft:dirt",
                texture: "textures/blocks/dirt.png",
                name: "Dirt"
            },
            {
                id: "minecraft:oak_planks",
                texture: "textures/blocks/planks_oak.png",
                name: "Oak Planks"
            },
            {
                id: "minecraft:bricks",
                texture: "textures/blocks/brick.png",
                name: "Bricks"
            }
            // ... etc
        ]
    },
    coloredBlocks: {
        name: "Colored Blocks",
        icon: "textures/blocks/wool_colored_white.png",
        description: "§8Decorative colored materials",
        items: [
            {
                id: "minecraft:white_wool",
                texture: "textures/blocks/wool_colored_white.png",
                name: "White Wool"
            },
            {
                id: "minecraft:white_concrete",
                texture: "textures/blocks/concrete_white.png",
                name: "White Concrete"
            },
            {
                id: "minecraft:white_terracotta",
                texture: "textures/blocks/hardened_clay_stained_white.png",
                name: "White Terracotta"
            }
            // ... etc for other colors
        ]
    },
    tools: {
        name: "Tools & Weapons",
        icon: "textures/items/diamond_sword.png",
        description: "§8Tools, weapons and armor",
        items: [
            {
                id: "minecraft:wooden_pickaxe",
                texture: "textures/items/wood_pickaxe.png",
                name: "Wooden Pickaxe"
            },
            {
                id: "minecraft:stone_sword",
                texture: "textures/items/stone_sword.png",
                name: "Stone Sword"
            },
            {
                id: "minecraft:diamond_axe",
                texture: "textures/items/diamond_axe.png",
                name: "Diamond Axe"
            }
            // ... etc
        ]
    },
    farming: {
        name: "Farming & Food",
        icon: "textures/items/wheat.png",
        description: "§8Crops and food items",
        items: [
            {
                id: "minecraft:wheat",
                texture: "textures/items/wheat.png",
                name: "Wheat"
            },
            {
                id: "minecraft:carrot",
                texture: "textures/items/carrot.png",
                name: "Carrot"
            },
            {
                id: "minecraft:bread",
                texture: "textures/items/bread.png",
                name: "Bread"
            }
            // ... etc
        ]
    },
    redstone: {
        name: "Redstone",
        icon: "textures/items/redstone_dust.png",
        description: "§8Redstone and mechanisms",
        items: [
            {
                id: "minecraft:redstone",
                texture: "textures/items/redstone_dust.png",
                name: "Redstone Dust"
            },
            {
                id: "minecraft:piston",
                texture: "textures/blocks/piston_top_normal.png",
                name: "Piston"
            },
            {
                id: "minecraft:repeater",
                texture: "textures/items/repeater.png",
                name: "Redstone Repeater"
            }
            // ... etc
        ]
    },
    combat: {
        name: "Combat",
        icon: "textures/items/diamond_sword.png",
        description: "§8Combat items and drops",
        items: [
            {
                id: "minecraft:rotten_flesh",
                texture: "textures/items/rotten_flesh.png",
                name: "Rotten Flesh"
            },
            {
                id: "minecraft:bone",
                texture: "textures/items/bone.png",
                name: "Bone"
            },
            {
                id: "minecraft:spider_eye",
                texture: "textures/items/spider_eye.png",
                name: "Spider Eye"
            }
            // ... etc
        ]
    },
    misc: {
        name: "Miscellaneous",
        icon: "textures/items/bucket_empty.png",
        description: "§8Other useful items",
        items: [
            {
                id: "minecraft:bucket",
                texture: "textures/items/bucket_empty.png",
                name: "Bucket"
            },
            {
                id: "minecraft:compass",
                texture: "textures/items/compass_item.png",
                name: "Compass"
            },
            {
                id: "minecraft:map",
                texture: "textures/items/map_empty.png",
                name: "Empty Map"
            }
            // ... etc
        ]
    },
    ores: {
        name: "Ore Blocks",
        icon: "textures/blocks/coal_ore.png",
        description: "§8Mineral resources found underground",
        items: [
            {
                "id": "minecraft:coal_ore",
                "texture": "textures/blocks/coal_ore.png",
                "name": "Coal Ore"
            },
            {
                "id": "minecraft:iron_ore",
                "texture": "textures/blocks/iron_ore.png",
                "name": "Iron Ore"
            },
            {
                "id": "minecraft:gold_ore",
                "texture": "textures/blocks/gold_ore.png",
                "name": "Gold Ore"
            },
            {
                "id": "minecraft:lapis_ore",
                "texture": "textures/blocks/lapis_ore.png",
                "name": "Lapis Lazuli Ore"
            },
            {
                "id": "minecraft:diamond_ore",
                "texture": "textures/blocks/diamond_ore.png",
                "name": "Diamond Ore"
            },
            {
                "id": "minecraft:redstone_ore",
                "texture": "textures/blocks/redstone_ore.png",
                "name": "Redstone Ore"
            },
            {
                "id": "minecraft:emerald_ore",
                "texture": "textures/blocks/emerald_ore.png",
                "name": "Emerald Ore"
            },
            {
                "id": "minecraft:quartz_ore",
                "texture": "textures/blocks/quartz_ore.png",
                "name": "Nether Quartz Ore"
            },
            {
                "id": "minecraft:coal_block",
                "texture": "textures/blocks/coal_block.png",
                "name": "Coal Block"
            },
            {
                "id": "minecraft:iron_block",
                "texture": "textures/blocks/iron_block.png",
                "name": "Iron Block"
            },
            {
                "id": "minecraft:gold_block",
                "texture": "textures/blocks/gold_block.png",
                "name": "Gold Block"
            },
            {
                "id": "minecraft:lapis_block",
                "texture": "textures/blocks/lapis_block.png",
                "name": "Lapis Lazuli Block"
            },
            {
                "id": "minecraft:diamond_block",
                "texture": "textures/blocks/diamond_block.png",
                "name": "Diamond Block"
            },
            {
                "id": "minecraft:redstone_block",
                "texture": "textures/blocks/redstone_block.png",
                "name": "Redstone Block"
            },
            {
                "id": "minecraft:emerald_block",
                "texture": "textures/blocks/emerald_block.png",
                "name": "Emerald Block"
            },
            {
                "id": "minecraft:quartz_block",
                "texture": "textures/blocks/quartz_block_side.png",
                "name": "Quartz Block"
            }
        ]
    }

};

// Helper function to get all available blocks (for backward compatibility)
export const AVAILABLE_BLOCKS = Object.values(CREATIVE_CATEGORIES)
    .flatMap(category => category.items)
    .map(item => item.id);

// Helper function to get item info by ID
export function getItemInfo(itemId) {
    for (const category of Object.values(CREATIVE_CATEGORIES)) {
        const item = category.items.find(item => item.id === itemId);
        if (item) return item;
    }
    return null;
}

// Helper function to get category by item ID
export function getItemCategory(itemId) {
    for (const [categoryId, category] of Object.entries(CREATIVE_CATEGORIES)) {
        if (category.items.some(item => item.id === itemId)) {
            return categoryId;
        }
    }
    return null;
}
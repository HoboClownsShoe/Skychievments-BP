// In defaultCollections.js

export const DEFAULT_COLLECTIONS = {
    "collections": [
        {
            "id": "cobblestone_1",
            "parentId": "group_mining",
            "displayName": "§8Stone Age Begins",
            "description": "Your first stepping stone to success!",
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
                    "displayText": "Haste Effect (5 minutes)"
                }
            ],
            "enabled": true,
            "order": 0
        },
        {
            "id": "basic_tools_1",
            "parentId": "group_tools",
            "displayName": "§8Tool Collection",
            "description": "Craft your first set of tools!",
            "icon": "textures/ui/tool_icon",
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
        },
        {
            "id": "farming_start_1",
            "parentId": "group_farming",
            "displayName": "§8Beginning Farmer",
            "description": "Start your farming journey!",
            "icon": "textures/ui/farming_icon.png",
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
        }
    ]
};
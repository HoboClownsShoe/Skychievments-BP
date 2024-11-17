// scripts/config/defaultCollections.js
export const DEFAULT_COLLECTIONS = {
    "collections": [
        {
            "id": "cobblestone_basic",
            "parentId": "group_mining",
            "name": "Basic Cobblestone",
            "displayName": "§7§lStone Age Begins",
            "description": "§7Your first stepping stone to success!",
            "icon": "minecraft:cobblestone",
            "itemId": "minecraft:cobblestone",
            "amount": 64,
            "reward": "give @p stone_pickaxe 1",
            "rewardText": "Stone Pickaxe",
            "enabled": true,
            "order": 0
        },
        {
            "id": "wheat_starter",
            "parentId": "group_farming",
            "name": "Beginning Farmer",
            "displayName": "§e§lBeginning Farmer",
            "description": "§7Start your farming journey!",
            "icon": "minecraft:wheat",
            "itemId": "minecraft:wheat",
            "amount": 64,
            "reward": "give @p bread 16",
            "rewardText": "16 Bread",
            "enabled": true,
            "order": 0
        }
        // ... other collections
    ]
};
// scripts/config/defaultCollections.js
export const DEFAULT_COLLECTIONS = {
    "collections": [
        {
            "id": "cobblestone_basic",
            "name": "Basic Cobblestone",
            "displayName": "§6§lCobblestone Collector",
            "description": "§7Collect cobblestone to earn your first diamond",
            "icon": "minecraft:cobblestone",
            "itemId": "minecraft:cobblestone",
            "amount": 64,
            "reward": "give @p diamond 1",
            "rewardText": "1 Diamond",
            "enabled": true
        },
        {
            "id": "wood_basic",
            "name": "Basic Wood",
            "displayName": "§2§lWoodcutter",
            "description": "§7Chop down trees for iron rewards",
            "icon": "minecraft:oak_log",
            "itemId": "minecraft:oak_log",
            "amount": 32,
            "reward": "give @p iron_ingot 4",
            "rewardText": "4 Iron Ingots",
            "enabled": true
        }
    ]
};
// scripts/config/guildQuests.js
// Defines the quests for each guild, similar to DEFAULT_COLLECTIONS
export const DEFAULT_GUILD_QUESTS = {
    "guild_miners": [
        {
            id: "miners_quest_1",
            parentId: "guild_miners",
            displayName: "Stone Collector I",
            description: "Mine 64 stone blocks.",
            icon: "textures/ui/guildIcons/miners_placeholder.png",
            requirements: [
                {
                    type: "collect",
                    itemId: "minecraft:stone",
                    amount: 64
                }
            ],
            rewards: [
                {
                    type: "item",
                    itemId: "minecraft:iron_pickaxe",
                    amount: 1,
                    displayText: "1x Iron Pickaxe"
                },
                {
                    type: "guild_points",
                    amount: 10,
                    displayText: "+10 Guild Points"
                }
            ],
            enabled: true,
            order: 0
        },
        {
            id: "miners_quest_2",
            parentId: "guild_miners",
            displayName: "Stone Collector II",
            description: "Mine 100 stone blocks.",
            icon: "textures/ui/guildIcons/miners_placeholder.png",
            requirements: [
                {
                    type: "collect",
                    itemId: "minecraft:stone",
                    amount: 100
                }
            ],
            rewards: [
                {
                    type: "item",
                    itemId: "minecraft:diamond_pickaxe",
                    amount: 1,
                    displayText: "1x Diamond Pickaxe"
                },
                {
                    type: "guild_points",
                    amount: 20,
                    displayText: "+20 Guild Points"
                }
            ],
            enabled: true,
            order: 1
        }
    ],
    "guild_builders": [
        {
            id: "builders_quest_1",
            parentId: "guild_builders",
            displayName: "Builder's Start",
            description: "Place 8 Crafting Tables, you will probably need them.",
            icon: "textures/ui/guildIcons/builders_placeholder.png",
            requirements: [
                {
                    type: "onPlace",
                    itemId: "minecraft:crafting_table",
                    amount: 8
                }
            ],
            rewards: [
                {
                    type: "item",
                    itemId: "minecraft:scaffolding",
                    amount: 32,
                    displayText: "32x Scaffolding"
                },
                {
                    type: "guild_points",
                    amount: 10,
                    displayText: "+10 Guild Points"
                }
            ],
            enabled: true,
            order: 0
        }
    ],
    "guild_warriors": [
        {
            id: "warriors_quest_1",
            parentId: "guild_warriors",
            displayName: "First Blood",
            description: "Defeat 10 hostile mobs.",
            icon: "textures/ui/guildIcons/warriors_placeholder.png",
            requirements: [
                {
                    type: "kill",
                    entityType: "minecraft:hostile_mob",
                    amount: 10
                }
            ],
            rewards: [
                {
                    type: "item",
                    itemId: "minecraft:shield",
                    amount: 1,
                    displayText: "1x Shield"
                },
                {
                    type: "guild_points",
                    amount: 10,
                    displayText: "+10 Guild Points"
                }
            ],
            enabled: true,
            order: 0
        }
    ]
    // Add more quests and guilds as needed
};

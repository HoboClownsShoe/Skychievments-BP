// scripts/config/guildGroups.js
// Defines the available guilds and their display properties
export const GUILD_GROUPS = [
    {
        id: "guild_miners",
        name: "Miners Guild",
        displayName: "Miners Guild",
        description: "§7Dedicated to the art of mining.",
        icon: "textures/ui/guildIcons/miners_placeholder.png",
        order: 100,
        enabled: true,
        settings: {
            maxQuestsPerGuild: 100
        }
    },
    {
        id: "guild_builders",
        name: "Builders Guild",
        displayName: "Builders Guild",
        description: "§7Masters of construction.",
        icon: "textures/ui/guildIcons/builders_placeholder.png",
        order: 200,
        enabled: true
    },
    {
        id: "guild_warriors",
        name: "Warriors Guild",
        displayName: "Warriors Guild",
        description: "§7Champions of combat.",
        icon: "textures/ui/guildIcons/warriors_placeholder.png",
        order: 300,
        enabled: true
    }
    // Add more guilds as needed
];

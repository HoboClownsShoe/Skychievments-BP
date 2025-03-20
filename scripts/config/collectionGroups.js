// Define the collection groups with their properties
export const COLLECTION_GROUPS = [
    {
        id: "group_tools",
        name: "Tools",
        displayName: "Tool Time",
        description: "§7Right tool for the Job",
        icon: "textures/ui/groupIcons/tool_icon.png",
        order: 100,
        enabled: true,
        settings: {
            // Custom settings can override defaults
            maxCollectionsPerGroup: 100
        }
    },
    {
        id: "group_mining",
        name: "Mining",
        displayName: "Mining",
        description: "§7Mine your way to success!",
        icon: "textures/ui/groupIcons/mining_icon.png",
        order: 200,
        enabled: true,
        settings: {
            maxCollectionsPerGroup: 100  // Mining might need more slots
        }
    },
    {
        id: "group_farming",
        name: "Farming",
        displayName: "Farming",
        description: "§7Grow your farming empire!",
        icon: "textures/ui/groupIcons/farming_icon.png",
        order: 300,
        enabled: true
    },
    {
        id: "group_combat",
        name: "Combat",
        displayName: "Combat",
        description: "§7Prove your combat prowess!",
        icon: "textures/ui/groupIcons/combat_icon.png",
        order: 400,
        enabled: true
    },
    {
        id: "group_technology",
        name: "Technology",
        displayName: "Tech",
        description: "§7Time to Automate",
        icon: "textures/ui/groupIcons/tech_icon.png",
        order: 500,
        enabled: true
    },
    {
        id: "group_fishing",
        name: "Fishing",
        displayName: "Time to Fish",
        description: "§7Cast a line....",
        icon: "textures/ui/groupIcons/fishing_icon.png",
        order: 600,
        enabled: true
    },
    {
        id: "group_spare",
        name: "spare",
        displayName: "Spare",
        description: "§7Spare",
        icon: "textures/ui/groupIcons/fishing_icon.png",
        order: 700,
        enabled: true
    }
];


// scripts/config/collectionGroups.js
export const COLLECTION_GROUPS = [
    {
        id: "group_tools",
        name: "Tools",
        displayName: "§2§lTool Time",
        description: "§7Right tool for the Job",
        icon: "textures/ui/groupIcons/tool_icon.png",
        order: 0
    },
    {
        id: "group_mining",
        name: "Mining",
        displayName: "§2§lMining",
        description: "§7Mine your way to success!",
        icon: "textures/ui/groupIcons/mining_icon.png",
        order: 10
    },
    {
        id: "group_farming",
        name: "Farming",
        displayName: "§2§lFarming",
        description: "§7Grow your farming empire!",
        icon: "textures/ui/groupIcons/farming_icon.png",
        order: 20
    },
    {
        id: "group_combat",
        name: "Combat",
        displayName: "§2§lCombat",
        description: "§7Prove your combat prowess!",
        icon: "textures/ui/groupIcons/combat_icon.png",
        order: 40
    },
    {
        id: "group_technology",
        name: "Technology",
        displayName: "§2§lTech",
        description: "§7Time to Automate",
        icon: "textures/ui/groupIcons/tech_icon.png",
        order: 50
    },
    {
        id: "group_fishing",
        name: "Fishing",
        displayName: "§2§lTime to Fish",
        description: "§7Cast a line....",
        icon: "textures/ui/groupIcons/fishing_icon.png",
        order: 60
    }
    
];

// Helper function to get all group IDs
export function getGroupIds() {
    return COLLECTION_GROUPS.map(group => group.id);
}

// Helper function to get group by ID
export function getGroupById(groupId) {
    return COLLECTION_GROUPS.find(group => group.id === groupId);
}
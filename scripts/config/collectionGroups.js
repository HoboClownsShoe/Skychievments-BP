// scripts/config/collectionGroups.js
export const COLLECTION_GROUPS = [
    {
        id: "group_mining",
        name: "Mining",
        displayName: "§2§lMining Collections",
        description: "§7Mine your way to success!",
        icon: "textures/ui/mining_icon",
        order: 0
    },
    {
        id: "group_farming",
        name: "Farming",
        displayName: "§2§lFarming Collections",
        description: "§7Grow your farming empire!",
        icon: "textures/ui/farming_icon",
        order: 1
    },
    {
        id: "group_foraging",
        name: "Foraging",
        displayName: "§2§lForaging Collections",
        description: "§7Master the art of woodcutting!",
        icon: "textures/ui/foraging_icon",
        order: 2
    },
    {
        id: "group_combat",
        name: "Combat",
        displayName: "§2§lCombat Collections",
        description: "§7Prove your combat prowess!",
        icon: "textures/ui/combat_icon",
        order: 3
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
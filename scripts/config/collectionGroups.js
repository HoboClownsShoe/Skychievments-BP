// scripts/config/collectionGroups.js

// Default display settings for groups
const DEFAULT_GROUP_SETTINGS = {
    iconSize: 32,
    defaultOrder: 999,
    maxCollectionsPerGroup: 150  // Practical limit based on dynamic property size
};

// Define the collection groups with their properties
export const COLLECTION_GROUPS = [
    {
        id: "group_tools",
        name: "Tools",
        displayName: "§2§lTool Time",
        description: "§7Right tool for the Job",
        icon: "textures/ui/groupIcons/tool_icon.png",
        order: 0,
        settings: {
            // Custom settings can override defaults
            maxCollectionsPerGroup: 100
        }
    },
    {
        id: "group_mining",
        name: "Mining",
        displayName: "§2§lMining",
        description: "§7Mine your way to success!",
        icon: "textures/ui/groupIcons/mining_icon.png",
        order: 10,
        settings: {
            maxCollectionsPerGroup: 100  // Mining might need more slots
        }
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

// Helper class for managing collection groups
export class CollectionGroupManager {
    /**
     * Get a collection group by its ID
     * @param {string} groupId - The ID of the group to find
     * @returns {object|null} The group object or null if not found
     */
    static getGroupById(groupId) {
        return COLLECTION_GROUPS.find(group => group.id === groupId);
    }

    /**
     * Get all group IDs in order
     * @returns {string[]} Array of group IDs
     */
    static getGroupIds() {
        return COLLECTION_GROUPS
            .sort((a, b) => a.order - b.order)
            .map(group => group.id);
    }

    /**
     * Get the storage key for a specific group
     * @param {string} groupId - The ID of the group
     * @returns {string} The storage key for the group
     */
    static getGroupStorageKey(groupId) {
        return `sk_collections_group_${groupId}`;
    }

    /**
     * Get the maximum allowed collections for a group
     * @param {string} groupId - The ID of the group
     * @returns {number} Maximum number of collections allowed
     */
    static getGroupCollectionLimit(groupId) {
        const group = this.getGroupById(groupId);
        return group?.settings?.maxCollectionsPerGroup || 
               DEFAULT_GROUP_SETTINGS.maxCollectionsPerGroup;
    }

    /**
     * Check if a group has space for more collections
     * @param {string} groupId - The ID of the group
     * @param {number} currentCount - Current number of collections in the group
     * @returns {boolean} Whether the group can accept more collections
     */
    static canAddToGroup(groupId, currentCount) {
        const limit = this.getGroupCollectionLimit(groupId);
        return currentCount < limit;
    }

    /**
     * Get groups by category type
     * @param {string} category - Category to filter by (e.g., "resource", "combat")
     * @returns {object[]} Array of matching groups
     */
    static getGroupsByCategory(category) {
        return COLLECTION_GROUPS.filter(group => 
            group.id.toLowerCase().includes(category.toLowerCase()));
    }

    /**
     * Get display settings for a group
     * @param {string} groupId - The ID of the group
     * @returns {object} Combined default and custom settings
     */
    static getGroupSettings(groupId) {
        const group = this.getGroupById(groupId);
        return {
            ...DEFAULT_GROUP_SETTINGS,
            ...(group?.settings || {})
        };
    }

    /**
     * Validate a group ID
     * @param {string} groupId - The ID to validate
     * @returns {boolean} Whether the group ID is valid
     */
    static isValidGroupId(groupId) {
        return COLLECTION_GROUPS.some(group => group.id === groupId);
    }
}

// Export for use in other files
export const MAX_COLLECTIONS_TOTAL = COLLECTION_GROUPS.reduce(
    (total, group) => total + (group.settings?.maxCollectionsPerGroup || 
                              DEFAULT_GROUP_SETTINGS.maxCollectionsPerGroup), 
    0
);
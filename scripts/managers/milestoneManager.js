// MilestoneManager.js - Updated for statistics integration
import { system, world } from "@minecraft/server";
import { JsonDatabase } from '../database/con-database.js';
import { MILESTONES } from '../config/milestones'
import { Logger } from '../utils/logger.js';
import { StatisticsManager } from '../managers/statisticsManager.js';
import { QuestPointsManager } from '../managers/questPointManager.js';
import { CollectionHandler } from '../managers/collectionsManager';
import { showTipToast } from '../utils/toast.js';
import { RewardManager } from '../managers/rewardManager.js';
import { itemDatabase } from './itemManager.js';

export class MilestoneManager {
    static #progressCheckingEnabled = true;
    static #progressCheckingInterval = null;

    static async initialize() {
        try {
            MilestoneHandler.initialize();
            MilestoneStorage.initialize();

            this.startProgressChecking();

            for (const [milestoneId, defaultMilestones] of Object.entries(MILESTONES)) {
                for (const milestone of defaultMilestones) {
                    const existingMilestone = MilestoneStorage.getMilestone(milestone.id);
                    if (!existingMilestone) {
                        await MilestoneStorage.saveMilestone(milestone)
                    }
                }
            }
            Logger.log("Collection storage initialized with defaults", "DEBUG", "COLLECTION_MANAGER");
            return true;

        } catch (error) {
            Logger.log(`Failed to initialize milestone storage: ${error}`, "ERROR", "MILESTONE_MANAGER");
            return false;
        }
    }

    static startProgressChecking() {
        if (this.#progressCheckingInterval) {
            system.clearRun(this.#progressCheckingInterval);
        }

        if (this.#progressCheckingEnabled) {
            // First, set up individual intervals for each current player
            const setupPlayerChecks = () => {
                const players = Array.from(world.getAllPlayers());
                const totalPlayers = players.length;

                if (totalPlayers === 0) return;

                // Calculate the stagger time between starting each player's checks
                const staggerTicks = Math.floor(300 / totalPlayers); // Spread initial checks across 15 seconds

                players.forEach((player, index) => {
                    // Create a unique identifier for this player's interval
                    const intervalId = `milestone_check_${player.id}`;

                    // Clear any existing interval for this player
                    if (this[intervalId]) {
                        system.clearRun(this[intervalId]);
                    }

                    // Start a new interval with initial delay
                    system.runTimeout(() => {
                        // Set up the 15-second recurring check for this player
                        this[intervalId] = system.runInterval(() => {
                            if (!player.isValid()) {
                                system.clearRun(this[intervalId]);
                                delete this[intervalId];
                                return;
                            }

                            console.log(`Milestone checking for player : ${player.id}`);
                            // for (const [milestoneId, defaultMilestones] of Object.entries(MILESTONES)) {
                            //     for (const milestone of defaultMilestones) {
                            //         MilestoneHandler.updateMilestoneProgress(player, milestone);
                            //     }
                            // }
                            MilestoneHandler.checkAllActiveMilestones(player);
                        }, 300); // 15 seconds recurring interval
                    }, index * staggerTicks); // Initial stagger delay
                });
            };

            // Set up initial checks
            setupPlayerChecks();

            // Monitor for new players and set up their checks
            this.#progressCheckingInterval = system.runInterval(() => {
                setupPlayerChecks();
            }, 300);

            Logger.log("Milestone progress checking started", "DEBUG", "startProgressChecking");
        }
    }

    static stopProgressChecking() {
        if (this.#progressCheckingInterval) {
            system.clearRun(this.#progressCheckingInterval);
            this.#progressCheckingInterval = null;

            // Clean up all individual player intervals
            const players = Array.from(world.getAllPlayers());
            players.forEach(player => {
                const intervalId = `milestone_check_${player.id}`;
                if (this[intervalId]) {
                    system.clearRun(this[intervalId]);
                    delete this[intervalId];
                }
            });

            Logger.log("Milestone progress checking stopped", "DEBUG", "MILESTONE_MANAGER");
        }
    }

    // static startProgressChecking() {
    //     if (this.#progressCheckingInterval) {
    //         system.clearRun(this.#progressCheckingInterval);
    //     }

    //     if (this.#progressCheckingEnabled) {            
    //         this.#progressCheckingInterval = system.runInterval(() => {                
    //             for (const player of world.getAllPlayers()) {
    //                 console.log(`Milestone checking for player : ${player.id}`)
    //                 for (const [milestoneId, defaultMilestones] of Object.entries(MILESTONES)) {
    //                     for (const milestone of defaultMilestones) {
    //                         MilestoneHandler.updateMilestoneProgress(player, milestone);
    //                     }
    //                 }
    //             }
    //         }, 300); // 15 seconds in ticks
    //         Logger.log("Milestone progress checking started", "DEBUG", "MILESTONE_MANAGER");
    //     }
    // }

    // static stopProgressChecking() {
    //     if (this.#progressCheckingInterval) {
    //         system.clearRun(this.#progressCheckingInterval);
    //         this.#progressCheckingInterval = null;
    //         Logger.log("Milestone progress checking stopped", "DEBUG", "MILESTONE_MANAGER");
    //     }
    // }

    static toggleProgressChecking() {
        this.#progressCheckingEnabled = !this.#progressCheckingEnabled;

        if (this.#progressCheckingEnabled) {
            this.startProgressChecking();
        } else {
            this.stopProgressChecking();
        }

        return this.#progressCheckingEnabled;
    }

    static isProgressCheckingEnabled() {
        return this.#progressCheckingEnabled;
    }

}

export class MilestoneHandler {
    static #milestoneProgressDB;
    static #activatedMilestonesDB;

    /**
     * Initialize the Milestone manager
     */
    static initialize() {
        try {
            this.#milestoneProgressDB = new JsonDatabase("skychievments_milestone_progress");
            this.#activatedMilestonesDB = new JsonDatabase("skychievments_milestone_activations");
            Logger.log("Milestone progress initialized", "DEBUG", "initialize");
            return true;
        } catch (error) {
            console.warn(`Failed to initialize Milestone progress: ${error}`);
            return false;
        }
    }

    /**
     * Check if a milestone is activated for a player
    */
    static async isActivated(player, milestoneId) {
        try {
            // Get activations for this player
            const activations = this.#activatedMilestonesDB.get(player.id) || {};

            // Check if this milestone is activated
            if (activations[milestoneId]) {
                return true;
            }

            // Also check if the milestone is auto-activated (no activatedBy requirements)
            const milestone = MilestoneStorage.getMilestone(milestoneId);
            if (milestone && (!milestone.options?.activatedBy || milestone.options.activatedBy.length === 0)) {
                return true; // No activation requirements means always activated
            }

            return false;
        } catch (error) {
            Logger.log(`Error checking milestone activation: ${error}`, "ERROR", "isActivated");
            return false;
        }
    }

    static async activateMilestone(player, milestoneId) {
        try {
            // Get current activations
            let activations = this.#activatedMilestonesDB.get(player.id) || {};

            // Check if the milestone exists
            const milestone = MilestoneStorage.getMilestone(milestoneId);
            if (!milestone) {
                Logger.log(`Cannot activate nonexistent milestone: ${milestoneId}`, 
                    "ERROR", "activateMilestone");
                return false;
            }   
            
            // Mark this milestone as activated
            activations[milestoneId] = {
                activatedAt: Date.now(),
                activatedBy: "reference" // Could also track which milestone activated it
            };

            // Save updated activations
            this.#activatedMilestonesDB.set(player.id, activations);
            await this.initializePlayerMilestoneIfNeeded(player, milestone);
            Logger.log(`Activated milestone ${milestoneId} for player ${player.name}`, "DEBUG", "activateMilestone");
            return true;
        } catch (error) {
            Logger.log(`Error activating milestone: ${error}`, "ERROR", "activateMilestone");
            return false;
        }
    }

    static async initializePlayerMilestones(player) {
        try {
            let playerProgress = this.#milestoneProgressDB.get(player.id);
            if (!playerProgress) {
                playerProgress = {};
            }

            for (const [milestoneId, defaultMilestones] of Object.entries(MILESTONES)) {
                for (const milestone of defaultMilestones) {
                    if (!playerProgress[milestone.id]) {
                        const firstTier = milestone.collections.find(c => c.tier === 1);
                        playerProgress[milestone.id] = {
                            currentTier: 1,
                            requirements: firstTier.requirements.map(req => ({
                                currentCount: 0,
                                completed: false
                            })),
                            completed: false,
                            lastCompleted: 0
                        };
                    }
                }
            }

            this.#milestoneProgressDB.set(player.id, playerProgress);
            Logger.log(`Initialized milestones for player ${player.name}`, "DEBUG", "MILESTONE_HANDLER");
            return true;
        } catch (error) {
            Logger.log(`Error initializing player milestones: ${error}`, "ERROR", "MILESTONE_HANDLER");
            return false;
        }
    }

    /**
     * Initialize player milestones with proper starting tier
     */
    static async initializePlayerMilestoneIfNeeded(player, milestone) {
        try {
            let playerProgress = this.#milestoneProgressDB.get(player.id) || {};
            
            // Skip if already initialized
            if (playerProgress[milestone.id]) {
                return true;
            }
            
            // Find starting tier - the lowest tier that doesn't have unlock requirements
            const availableTiers = milestone.collections
                .filter(c => !c.unlockedBy && !c.unlockedByAny)
                .map(c => c.tier);
            
            if (availableTiers.length === 0) {
                Logger.log(`No starting tier found for milestone ${milestone.id}`, 
                    "ERROR", "MILESTONE_HANDLER");
                return false;
            }
            
            const startTier = Math.min(...availableTiers);
            const firstTier = milestone.collections.find(c => c.tier === startTier);
            
            // Initialize progress for this milestone
            playerProgress[milestone.id] = {
                currentTier: startTier,
                requirements: firstTier.requirements ? firstTier.requirements.map(req => ({
                    currentCount: 0,
                    completed: false
                })) : [],
                completed: false,
                lastCompleted: 0,
                completedTiers: {}
            };
            
            // Save the updated progress
            this.#milestoneProgressDB.set(player.id, playerProgress);
            Logger.log(`Initialized milestone ${milestone.id} for player ${player.name}`, 
                "DEBUG", "initializePlayerMilestoneIfNeeded");
            return true;
        } catch (error) {
            Logger.log(`Error initializing milestone: ${error}`, "ERROR", "initializePlayerMilestoneIfNeeded");
            return false;
        }
    }

    static async getPlayerProgress(player, milestoneId) {
        try {
            let progress = this.#milestoneProgressDB.get(player.id);
            if (!progress || !progress[milestoneId]) {

                await this.initializePlayerMilestones(player);
                progress = this.#milestoneProgressDB.get(player.id);
            }
            return progress[milestoneId] || null;
        } catch (error) {
            Logger.log(`Error getting player progress: ${error}`, "ERROR", "getPlayerProgress");
            return null;
        }
    }

    static async savePlayerProgress(player, milestoneId, progressData) {
        try {
            let progress = this.#milestoneProgressDB.get(player.id) || {};
            progress[milestoneId] = progressData;
            this.#milestoneProgressDB.set(player.id, progress);
            return true;
        } catch (error) {
            Logger.log(`Error saving player progress: ${error}`, "ERROR", "savePlayerProgress");
            return false;
        }
    }

    /**
     * Check if a tier is unlocked based on the completion of other tiers
     */
    static isTierUnlocked(tierData, progress) {
        // If no unlocking conditions, tier is always available
        if (tierData.unlockedBy === undefined && tierData.unlockedByAny === undefined) {
            return true;
        }
        
        progress.completedTiers = progress.completedTiers || {};
        
        // Check for "AND" condition - all specified tiers must be completed
        if (tierData.unlockedBy !== undefined) {
            const requiredTiers = Array.isArray(tierData.unlockedBy) 
                ? tierData.unlockedBy 
                : [tierData.unlockedBy];
                
            // All required tiers must be completed
            return requiredTiers.every(requiredTier => !!progress.completedTiers[requiredTier]);
        }
        
        // Check for "OR" condition - any of the specified tiers must be completed
        if (tierData.unlockedByAny !== undefined) {
            const anyRequiredTiers = Array.isArray(tierData.unlockedByAny)
                ? tierData.unlockedByAny
                : [tierData.unlockedByAny];
                
            // At least one required tier must be completed
            return anyRequiredTiers.some(requiredTier => !!progress.completedTiers[requiredTier]);
        }
        
        return false;
    }

    /**
     * Find the next tier that is unlocked but not completed
     */
    static getNextUnlockedTier(milestone, progress) {
        progress.completedTiers = progress.completedTiers || {};
        
        // Get all tiers sorted by their tier number
        const allTiers = milestone.collections
            .map(c => c.tier)
            .sort((a, b) => a - b);
        
        // Check each tier to see if it's unlocked and not completed
        for (const tier of allTiers) {
            // Skip if already completed
            if (progress.completedTiers[tier]) {
                continue;
            }
            
            const tierData = milestone.collections.find(c => c.tier === tier);
            if (this.isTierUnlocked(tierData, progress)) {
                return tier;
            }
        }
        
        return -1; // No unlocked and uncompleted tiers found
    }

    /**
     * Update milestone progress for all activated milestones
     * This is called from the 15-second interval check
     */
    static async checkAllActiveMilestones(player) {
        try {
            // Get activations for this player
            const activations = this.#activatedMilestonesDB.get(player.id) || {};
            
            // Get all milestone IDs
            const allMilestoneIds = [];
            
           
            // Add auto-activated milestones (no activatedBy)
            for (const [groupId, milestones] of Object.entries(MILESTONES)) {
                for (const milestone of milestones) {
                    if (!milestone.options?.activatedBy || milestone.options.activatedBy.length === 0) {
                        allMilestoneIds.push(milestone.id);
                    }
                }
            }
            
            // Add explicitly activated milestones
            for (const milestoneId in activations) {
                if (!allMilestoneIds.includes(milestoneId)) {
                    allMilestoneIds.push(milestoneId);
                }
            }

            for (const milestoneId of allMilestoneIds) {
                console.warn(`${milestoneId} is Active`)
            }

            
            // Process each active milestone
            for (const milestoneId of allMilestoneIds) {
                const milestone = MilestoneStorage.getMilestone(milestoneId);
                if (!milestone) continue;
                
                await this.updateMilestoneProgress(player, milestone);
            }
            
            return true;
        } catch (error) {
            Logger.log(`Error checking active milestones: ${error}`, "ERROR", "checkAllActiveMilestones");
            return false;
        }
    }

    /**
     * Process a milestone reference type tier
     * Simply activates the referenced milestone and marks the tier as completed
     */
    static async processReferenceTier(player, currentTier) {
        try {
            // Get the referenced milestone ID
            const referencedMilestoneId = currentTier.reference?.milestoneId;
            if (!referencedMilestoneId) {
                Logger.log(`Reference tier missing milestoneId: ${currentTier.id}`, 
                    "ERROR", "processReferenceTier");
                return false;
            }
            
            // Activate the referenced milestone
            const activationSuccess = await this.activateMilestone(player, referencedMilestoneId);
            if (!activationSuccess) {
                Logger.log(`Failed to activate referenced milestone: ${referencedMilestoneId}`, 
                    "ERROR", "processReferenceTier");
                return false;
            }
            
            Logger.log(`Successfully activated milestone: ${referencedMilestoneId} from reference tier`, 
                "DEBUG", "processReferenceTier");
            
            // Always return success - the tier itself is considered complete
            // Progress on the referenced milestone will be handled separately
            return true;
        } catch (error) {
            Logger.log(`Error processing reference tier: ${error}`, "ERROR", "processReferenceTier");
            return false;
        }
    }

    /**
     * Update milestone progress, checking tier completion and unlocking
     */
    static async updateMilestoneProgress(player, milestone) {
        try {
            Logger.log(`updating progress for milestone ${milestone.id} for player ${player.name}`, "DEBUG", "updateMilestoneProgress");
            if (!milestone?.id) {
                Logger.log("Invalid milestone object", "ERROR", "updateMilestoneProgress");
                return false;
            }

            // Get all player progress data once
            const allProgress = this.#milestoneProgressDB.get(player.id) || {};            
            let progress = allProgress[milestone.id];
            let progressUpdated = false;

            // Initialize if needed
            if (!progress) {
                await this.initializePlayerMilestoneIfNeeded(player, milestone);
                progress = (this.#milestoneProgressDB.get(player.id) || {})[milestone.id];
                if (!progress) return false;
            }

            // Early exit checks
            if (progress.completed && !milestone.options?.repeatable?.enabled) {
                return false;
            }

            if (progress.completed && milestone.options?.repeatable?.enabled) {
                const cooldownMinutes = milestone.options.repeatable.cooldown;
                const timeSinceCompletion = (Date.now() - progress.lastCompleted) / (1000 * 60);
                if (timeSinceCompletion < cooldownMinutes) {
                    return false;
                }
            }

            // Check prerequisites using the already loaded progress data
            const prereqsMet = await this.checkPrerequisitesEfficient(player, milestone, allProgress);
            if (!prereqsMet) {
                return false;
            }

            let keepChecking = true;
            const rewardsToProcess = [];
            const newlyUnlockedTiers = new Set();
            const notifications = [];

            while (keepChecking && !progress.completed) {
                // Get current tier data
                const currentTier = milestone.collections.find(c => c.tier === progress.currentTier);
                if (!currentTier) return false;
                
                if (currentTier.type === 'milestone_reference') {
                    const referenceSuccess = await this.processReferenceTier(player, currentTier);
                    
                    if (referenceSuccess) {
                        // Mark this reference tier as completed
                        progress.completedTiers = progress.completedTiers || {};
                        progress.completedTiers[currentTier.tier] = {
                            completedAt: Date.now()
                        };
                        
                        // Add notification
                        const referencedMilestone = MilestoneStorage.getMilestone(currentTier.reference.milestoneId);
                        if (referencedMilestone) {
                            notifications.push(`Unlocked milestone: ${referencedMilestone.displayName}`);
                        }
                        
                        // Process rewards for this tier
                        if (currentTier.rewards && currentTier.rewards.length > 0) {
                            rewardsToProcess.push(currentTier.rewards);
                        }
                        
                        // Find next tier to work on
                        const nextTier = this.getNextUnlockedTier(milestone, progress);
                        if (nextTier !== -1) {
                            progress.currentTier = nextTier;
                            const nextTierData = milestone.collections.find(c => c.tier === nextTier);
                            if (nextTierData && nextTierData.requirements) {
                                progress.requirements = nextTierData.requirements.map(req => ({
                                    currentCount: 0,
                                    completed: false
                                }));
                            } else {
                                progress.requirements = [];
                            }
                            progressUpdated = true;
                        } else {
                            // If no more tiers to complete, mark milestone as done
                            progress.completed = true;
                            progress.lastCompleted = Date.now();
                            keepChecking = false;
                        }
                    } else {
                        keepChecking = false; // Reference processing failed, try again later
                    }
                    
                    continue;
                }

                // Check current tier requirements
                const { allRequirementsMet, requirementsUpdated } = await this.checkTierRequirements(
                    player,
                    currentTier,
                    progress
                );
                
                if (requirementsUpdated) {
                    progressUpdated = true;
                }

                // If all requirements are met, process completion
                if (allRequirementsMet) {
                    // Add current tier's rewards to process
                    if (currentTier.rewards && currentTier.rewards.length > 0) {
                        rewardsToProcess.push(currentTier.rewards);
                    }
                    
                    // Record this tier as completed
                    progress.completedTiers = progress.completedTiers || {};
                    progress.completedTiers[currentTier.tier] = {
                        completedAt: Date.now()
                    };

                    // check i and activate any dependant milestones
                    await this.checkAndActivateDependentMilestones(player, milestone.id, currentTier.id);
                    
                   // Find newly unlocked tiers due to this completion
                    const tiersUnlockedByThisCompletion = this.findNewlyUnlockedTiers(
                    milestone, currentTier.tier, progress);
                    
                    // Record newly unlocked tiers for notifications
                    tiersUnlockedByThisCompletion.forEach(tier => newlyUnlockedTiers.add(tier));
                    
                    // Find next uncompleted and unlocked tier
                    const nextTier = this.getNextUnlockedTier(milestone, progress);
                    if (nextTier !== -1) {
                        progress.currentTier = nextTier;
                        // Initialize requirements for new tier
                        const nextTierData = milestone.collections.find(c => c.tier === nextTier);
                        if (nextTierData && nextTierData.requirements) {
                            progress.requirements = nextTierData.requirements.map(req => ({
                                currentCount: 0,
                                completed: false
                            }));
                        } else {
                            progress.requirements = [];
                        }
                        progressUpdated = true;
                    } else {
                        // If no more tiers to complete, mark milestone as done
                        progress.completed = true;
                        progress.lastCompleted = Date.now();
                        keepChecking = false;
                    }
                } else {
                    keepChecking = false; // Current tier not completed, stop checking
                }
            }

            // Process all accumulated rewards
            for (const rewards of rewardsToProcess) {
                await RewardManager.processRewards(player, rewards, "complete");
            }

            // If any tiers were newly unlocked, notify the player
            if (newlyUnlockedTiers.size > 0) {
                const unlockedTiersList = Array.from(newlyUnlockedTiers);
                const unlockedTiersData = unlockedTiersList
                    .map(tier => milestone.collections.find(c => c.tier === tier))
                    .filter(Boolean);
                
                if (unlockedTiersData.length > 0) {
                    const unlockMessage = `§q§lNew challenges unlocked in §r§q${milestone.displayName}§r\n§7- ${
                        unlockedTiersData.map(t => t.displayName).join('\n§7- ')
                    }`;
                    notifications.push(unlockMessage);
                }
            }

            // Send all notifications to the player
            if (notifications.length > 0) {
                for (const notification of notifications) {
                    player.sendMessage(notification);
                }
            }

            // Save progress only if it was updated
            if (progressUpdated) {
                allProgress[milestone.id] = progress;
                this.#milestoneProgressDB.set(player.id, allProgress);
            }

            return true;
        } catch (error) {
            Logger.log(`Error updating milestone progress: ${error}`, "ERROR", "updateMilestoneProgress");
            return false;
        }
    }

    /**
     * Find all tiers that would be newly unlocked by completing a specific tier
     */
    static findNewlyUnlockedTiers(milestone, completedTier, progress) {
        const newlyUnlocked = [];
        progress.completedTiers = progress.completedTiers || {};
        
        for (const collection of milestone.collections) {
            // Skip if already completed
            if (progress.completedTiers[collection.tier]) {
                continue;
            }
            
            // Check simple unlockedBy condition
            if (collection.unlockedBy !== undefined) {
                const requiredTiers = Array.isArray(collection.unlockedBy) 
                    ? collection.unlockedBy 
                    : [collection.unlockedBy];
                    
                // If this tier is part of requirements and all other requirements are met
                if (requiredTiers.includes(completedTier)) {
                    const otherRequirements = requiredTiers.filter(t => t !== completedTier);
                    const allOthersMet = otherRequirements.every(t => !!progress.completedTiers[t]);
                    
                    if (allOthersMet) {
                        newlyUnlocked.push(collection.tier);
                    }
                }
            }
            
            // Check unlockedByAny condition
            if (collection.unlockedByAny !== undefined) {
                const anyOptions = collection.unlockedByAny;
                
                // Handle direct tier match
                if (typeof anyOptions === 'number' && anyOptions === completedTier) {
                    newlyUnlocked.push(collection.tier);
                    continue;
                }
                
                // Handle array of tiers (OR condition)
                if (Array.isArray(anyOptions) && !Array.isArray(anyOptions[0])) {
                    if (anyOptions.includes(completedTier)) {
                        newlyUnlocked.push(collection.tier);
                        continue;
                    }
                }
                
                // Handle array of arrays (complex conditions)
                if (Array.isArray(anyOptions) && Array.isArray(anyOptions[0])) {
                    for (const option of anyOptions) {
                        if (Array.isArray(option) && option.includes(completedTier)) {
                            // This group contains our completed tier, check if the other requirements are met
                            const otherRequirements = option.filter(t => t !== completedTier);
                            const allOthersMet = otherRequirements.every(t => !!progress.completedTiers[t]);
                            
                            if (allOthersMet) {
                                newlyUnlocked.push(collection.tier);
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        return newlyUnlocked;
    }
    

    /**
    * Helper method to check tier requirements and update progress
    */
    static async checkTierRequirements(player, tierData, progress) {
        const playerStats = StatisticsManager.getPlayerStats(player);
        const categoryStats = StatisticsManager.getCategoryStats(player);
        const container = player.getComponent('inventory').container;
        const itemDb = itemDatabase.getInstance();
        
        let allRequirementsMet = true;
        let requirementsUpdated = false;
        
        if (!tierData.requirements || tierData.requirements.length === 0) {
            return { allRequirementsMet: true, requirementsUpdated: false };
        }
        
        // Check all requirements for current tier
        for (let i = 0; i < tierData.requirements.length; i++) {
            const requirement = tierData.requirements[i];
            let currentStatValue = 0;
            
            // Calculate current value based on requirement type
            switch (requirement.type) {
                case 'collect':
                    // Collection logic
                    currentStatValue = 0;
                    for (let j = 0; j < container.size; j++) {
                        const item = container.getItem(j);
                        if (item && item.typeId === requirement.itemId) {
                            currentStatValue += item.amount;
                        }
                    }
                    break;
                case 'collectAnyInCategory':
                    // Any item in category logic
                    currentStatValue = 0;
                    const categoryItems = itemDb.getBlocksByCategory(requirement.category);
                    if (Object.keys(categoryItems).length > 0) {
                        for (let j = 0; j < container.size; j++) {
                            const item = container.getItem(j);
                            if (item && categoryItems[item.typeId]) {
                                currentStatValue = 1;
                                break;
                            }
                        }
                    }
                    break;
                case 'collectAllInCategory':
                        // Get all items in the specified category
                        const allCategoryItems = itemDb.getBlocksByCategory(requirement.category);
                        const categoryItemIds = Object.keys(allCategoryItems);

                        if (categoryItemIds.length === 0) {
                            currentStatValue = 0;
                            break;
                        }

                        // Check if player has all these items
                        const foundItemIds = new Set();
                        for (let i = 0; i < container.size; i++) {
                            const item = container.getItem(i);
                            if (item && allCategoryItems[item.typeId]) {
                                foundItemIds.add(item.typeId);
                            }
                        }

                        // Player has all items if foundItemIds contains all categoryItemIds
                        currentStatValue = (foundItemIds.size === categoryItemIds.length) ? 1 : 0;

                    break;
                case "anyBrokenToolInCategory":
                    currentStatValue = 0
                    break;
                case "allBrokenToolInCategory":
                    currentStatValue = 0
                    break;

                case 'anyInCategory': // only checks against blocks broken
                    currentStatValue = categoryStats.getTotalForCategory(requirement.category);
                    break;
                case 'allInCategory':
                    currentStatValue = categoryStats.hasAllInCategory(requirement.category);
                    break;
                case 'break':
                    currentStatValue = playerStats.blockMined.getBlockType(requirement.itemId);
                    break;
                case 'place':
                    currentStatValue = playerStats.blockPlaced.getBlockType(requirement.itemId);
                    break;
                case 'kill':
                    currentStatValue = playerStats.entityKilled.getKillCount(requirement.itemId);
                    break;
                case 'anyBlock':
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:blocks_mined");
                    break;
                case "anyMob":
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:mob_kills");
                    break;
                case "walk":
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:walk_one_cm");
                    break;
                case "run":
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:sprint_one_cm");
                    break;
                case "sneek":
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:crouch_one_cm");
                    break;
                case "fly":
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:fly_one_cm");
                    break;
                case "climb":
                    currentStatValue = playerStats.custom.getCustomStat("minecraft:climb_one_cm");
                    break;
                // ... other requirement types
            }
            
            // Update individual requirement progress
            if (currentStatValue > progress.requirements[i].currentCount) {
                progress.requirements[i].currentCount = currentStatValue;
                progress.requirements[i].completed = currentStatValue >= requirement.amount;
                requirementsUpdated = true;
            }
            
            // Check if this requirement is met
            if (progress.requirements[i].currentCount < requirement.amount) {
                allRequirementsMet = false;
            }
        }
        
        return { allRequirementsMet, requirementsUpdated };
    }

    static async checkPrerequisitesEfficient(player, milestone, existingProgress) {
        try {
            Logger.log(`Checking prerequisites for ${milestone.id}`, "DEBUG", "checkPrerequisitesEfficient");

            if (!milestone.options?.prerequisites || milestone.options.prerequisites.length === 0) {
                Logger.log(`No prerequisites for milestone ${milestone.id}`, "DEBUG", "checkPrerequisitesEfficient");
                return true;
            }

            for (const prereq of milestone.options.prerequisites) {
                // Check if prerequisite is a quest first
                const questCompletion = await CollectionHandler.isCollectionCompleted(player, prereq.id);
                if (questCompletion) continue;

                // Check if prerequisite is a milestone using existing progress data
                const milestoneProgress = existingProgress[prereq.id];
                if (!milestoneProgress?.completed) {
                    Logger.log(`Prerequisite ${prereq.id} not completed on milestone ${milestone.id}`, "DEBUG", "checkPrerequisitesEfficient");
                    return false;
                }
            }

            return true;
        } catch (error) {
            Logger.log(`Error checking prerequisites: ${error}`, "ERROR", "checkPrerequisitesEfficient");
            return false;
        }
    }

    // Add this method to MilestoneHandler class
    static async checkAndActivateDependentMilestones(player, milestoneId, collectionId) {
        try {
            // Get all milestone groups
            for (const [groupId, milestones] of Object.entries(MILESTONES)) {
                for (const milestone of milestones) {
                    // Skip already activated milestones
                    const isAlreadyActivated = await this.isActivated(player, milestone.id);
                    if (isAlreadyActivated) continue;

                    // Check if this milestone is activated by the completed collection/milestone
                    if (milestone.options?.activatedBy) {
                        const activators = Array.isArray(milestone.options.activatedBy) 
                            ? milestone.options.activatedBy 
                            : [milestone.options.activatedBy];
                        
                        // Look for activation by collection OR milestone
                        const shouldActivate = activators.some(activator => 
                            activator === milestoneId || // Activate by milestone
                            activator === collectionId    // Activate by collection
                        );
                        
                        if (shouldActivate) {
                            await this.activateMilestone(player, milestone.id);
                            Logger.log(`Activated milestone ${milestone.id} for player ${player.name} via collection completion`, 
                                "DEBUG", "checkAndActivateDependentMilestones");
                                
                            // Notify player about newly unlocked milestone
                            player.sendMessage(`§q§lUnlocked new milestone: §r§q${milestone.displayName}`);
                        }
                    }
                }
            }
            return true;
        } catch (error) {
            Logger.log(`Error checking dependent milestones: ${error}`, "ERROR", "checkAndActivateDependentMilestones");
            return false;
        }
    }
    



}

export class MilestoneStorage {
    static #milestoneDB;

    static initialize() {
        try {
            this.#milestoneDB = new JsonDatabase("skychievments_milestones");
            Logger.log("Milestone Storage initialized", "DEBUG", "LOGGER");
            return true;
        } catch (error) {
            console.warn(`Failed to initialize Milestone Storage: ${error}`);
            return false;
        }
    }

    static getMilestone(id) {
        try {
            return this.#milestoneDB.has(id) ? this.#milestoneDB.get(id) : null;
        } catch (error) {
            Logger.log(`Error getting collection ${id}: ${error}`, "ERROR", "STORAGE");
            return null;
        }
    }

    static async saveMilestone(milestone) {
        try {
            if (!milestone?.id) {
                throw new Error('Invalid collection object');
            }
            this.#milestoneDB.set(milestone.id, milestone);
            return true;
        } catch (error) {
            Logger.log(`Error saving collection ${collection?.id}: ${error}`, "ERROR", "STORAGE");
            return false;
        }
    }


}
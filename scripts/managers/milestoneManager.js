// MilestoneManager.js - Updated for statistics integration
import { system, world } from "@minecraft/server";
import { JsonDatabase } from '../database/con-database.js';
import { MILESTONES } from '../config/milestones.js';
import { Logger } from '../utils/logger.js';
import { StatisticsManager } from '../managers/statisticsManager.js';
import { QuestPointsManager } from '../managers/questPointManager.js';
import { CollectionHandler } from '../managers/collectionsManager';
import { showTipToast } from '../utils/toast.js';
import { RewardManager } from '../managers/rewardManager.js';
import { itemDatabase } from './itemManager.js';
import { RequirementChecker } from './requirementsManager.js';
import { TimerTracker } from './timerManager.js';

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
            Logger.log("Collection storage initialized with defaults", "DEBUG", "MILESTONE");
            return true;

        } catch (error) {
            Logger.log(`Failed to initialize milestone storage: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static startProgressChecking() {
        if (this.#progressCheckingInterval) {
            system.clearRun(this.#progressCheckingInterval);
        }

        if (this.#progressCheckingEnabled) {
            const setupPlayerChecks = () => {
                const players = Array.from(world.getAllPlayers());
                const totalPlayers = players.length;

                if (totalPlayers === 0) return;

                const staggerTicks = Math.floor(300 / totalPlayers);

                players.forEach((player, index) => {
                    const intervalId = `milestone_check_${player.id}`;

                    if (this[intervalId]) {
                        system.clearRun(this[intervalId]);
                    }

                    system.runTimeout(() => {
                        this[intervalId] = system.runInterval(() => {
                            if (!player.isValid()) {
                                system.clearRun(this[intervalId]);
                                delete this[intervalId];
                                return;
                            }

                            //console.log(`Milestone checking for player : ${player.id}`);
                            MilestoneHandler.checkAllActiveMilestones(player);
                        }, 300);
                    }, index * staggerTicks);
                });
            };

            setupPlayerChecks();

            this.#progressCheckingInterval = system.runInterval(() => {
                setupPlayerChecks();
            }, 300);

            Logger.log("Milestone progress checking started", "DEBUG", "MILESTONE");
        }
    }

    static stopProgressChecking() {
        if (this.#progressCheckingInterval) {
            system.clearRun(this.#progressCheckingInterval);
            this.#progressCheckingInterval = null;

            const players = Array.from(world.getAllPlayers());
            players.forEach(player => {
                const intervalId = `milestone_check_${player.id}`;
                if (this[intervalId]) {
                    system.clearRun(this[intervalId]);
                    delete this[intervalId];
                }
            });

            Logger.log("Milestone progress checking stopped", "DEBUG", "MILESTONE");
        }
    }

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

    static initialize() {
        try {
            this.#milestoneProgressDB = new JsonDatabase("skychievments_milestone_progress");
            this.#activatedMilestonesDB = new JsonDatabase("skychievments_milestone_activations");
            Logger.log("Milestone progress initialized", "DEBUG", "MILESTONE");
            return true;
        } catch (error) {
            console.warn(`Failed to initialize Milestone progress: ${error}`);
            return false;
        }
    }

    static async isActivated(player, milestoneId) {
        try {
            const activations = this.#activatedMilestonesDB.get(player.id) || {};

            if (activations[milestoneId]) {
                return true;
            }

            const milestone = MilestoneStorage.getMilestone(milestoneId);
            if (milestone && (!milestone.options?.activatedBy || milestone.options.activatedBy.length === 0)) {
                return true;
            }

            return false;
        } catch (error) {
            Logger.log(`Error checking milestone activation: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static logMilestoneProgress(player, milestoneId, milestone) {
        try {
            const progress = this.#milestoneProgressDB.get(player.id)?.[milestoneId];
            if (!progress) {
                Logger.log(`No progress data found for milestone ${milestoneId}`, "DEBUG", "MILESTONE");
                return;
            }
            
            Logger.log(`Progress for milestone ${milestoneId}:`, "DEBUG", "MILESTONE");
            Logger.log(`- Current tier: ${progress.currentTier}`, "DEBUG", "MILESTONE");
            Logger.log(`- Completed: ${progress.completed}`, "DEBUG", "MILESTONE");
            Logger.log(`- Completed tiers: ${JSON.stringify(progress.completedTiers || {})}`, "DEBUG", "MILESTONE");
            
            if (milestone) {
                Logger.log(`- Checking tier unlock status:`, "DEBUG", "MILESTONE");
                for (const tierData of milestone.collections) {
                    const isUnlocked = this.isTierUnlocked(tierData, progress, true);
                    Logger.log(`  - Tier ${tierData.tier} (${tierData.id}): ${isUnlocked ? "UNLOCKED" : "LOCKED"}`, "DEBUG", "MILESTONE");
                }
            }
        } catch (error) {
            Logger.log(`Error logging milestone progress: ${error}`, "ERROR", "MILESTONE");
        }
    }

    static async activateMilestone(player, milestoneId) {
        try {
            let activations = this.#activatedMilestonesDB.get(player.id) || {};

            const milestone = MilestoneStorage.getMilestone(milestoneId);
            if (!milestone) {
                Logger.log(`Cannot activate nonexistent milestone: ${milestoneId}`, "ERROR", "MILESTONE");
                return false;
            }   
            
            activations[milestoneId] = {
                activatedAt: Date.now(),
                activatedBy: "reference"
            };

            this.#activatedMilestonesDB.set(player.id, activations);
            await this.initializePlayerMilestoneIfNeeded(player, milestone);

            // Start milestone-level timers
            this.#startMilestoneTimers(player, milestone);

            Logger.log(`Activated milestone ${milestoneId} for player ${player.name}`, "DEBUG", "MILESTONE");
            return true;
        } catch (error) {
            Logger.log(`Error activating milestone: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    /**
     * Starts timers for milestone-level time-based requirements
     * @param {object} player - The player
     * @param {object} milestone - The milestone object
     * @private
     */
    static #startMilestoneTimers(player, milestone) {
        try {
            // Start a timer for milestone activation
            TimerTracker.startTimer(player, milestone.id, "milestone_activated");
            Logger.log(`Started milestone activation timer for ${milestone.id}`, "DEBUG", "MILESTONE");
            
            // Check if any tiers in this milestone need the milestone-level timer
            for (const tier of milestone.collections) {
                if (!tier.requirements) continue;
                
                for (const req of tier.requirements) {
                    if (req.type === 'timePassedSince' && !req.tierId) {
                        // This is a milestone-level requirement (not tier-specific)
                        // Start a timer for this requirement using milestone-level context
                        const event = req.event || "milestone_activated";
                        
                        // Only start if it's a milestone-level event
                        if (event === "milestone_activated" || event === "firstSpawn") {
                            TimerTracker.startTimer(player, milestone.id, event);
                            Logger.log(`Started milestone-level timer for ${event} in milestone ${milestone.id}`, "DEBUG", "MILESTONE");
                        }
                    }
                }
            }
            
            // Notify timer system of milestone activation
            TimerTracker.handleEvent(player, "milestone_activated", { milestoneId: milestone.id });
            
        } catch (error) {
            Logger.log(`Error starting milestone timers: ${error}`, "ERROR", "MILESTONE");
        }
    }

    /**
     * Starts timers for tier-specific time-based requirements
     * @param {object} player - The player
     * @param {string} milestoneId - The milestone ID
     * @param {object} tierData - The tier data object
     * @private
     */
    static #startTierTimers(player, milestoneId, tierData) {
        try {
            if (!tierData.requirements) return;
            
            // Generate a unique ID for this tier
            const tierId = tierData.id || `tier_${tierData.tier}`;
            
            // Start a timer for tier activation
            TimerTracker.startTimer(player, milestoneId, `${tierId}_activated`);
            Logger.log(`Started tier activation timer for ${milestoneId}, tier ${tierData.tier}`, "DEBUG", "MILESTONE");
            
            // Check for any timePassedSince requirements in this tier
            for (const req of tierData.requirements) {
                if (req.type === 'timePassedSince') {
                    // Start a timer for this requirement
                    const event = req.event || `${tierId}_activated`;
                    TimerTracker.startTimer(player, milestoneId, event);
                    Logger.log(`Started timer for ${event} in milestone ${milestoneId}, tier ${tierData.tier}`, "DEBUG", "MILESTONE");
                }
            }
            
            // Notify timer system of tier activation
            TimerTracker.handleEvent(player, "tier_activated", { 
                milestoneId: milestoneId,
                tierId: tierId,
                tier: tierData.tier
            });
            
        } catch (error) {
            Logger.log(`Error starting tier timers: ${error}`, "ERROR", "MILESTONE");
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
                            currentTiers: [1],
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
            Logger.log(`Initialized milestones for player ${player.name}`, "DEBUG", "MILESTONE");
            return true;
        } catch (error) {
            Logger.log(`Error initializing player milestones: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static async initializePlayerMilestoneIfNeeded(player, milestone) {
        try {
            let playerProgress = this.#milestoneProgressDB.get(player.id) || {};
            
            if (playerProgress[milestone.id]) {
                return true;
            }
            
            const availableTiers = milestone.collections
                .filter(c => !c.unlockedBy && !c.unlockedByAny)
                .map(c => c.tier);
            
            if (availableTiers.length === 0) {
                Logger.log(`No starting tier found for milestone ${milestone.id}`, "ERROR", "MILESTONE");
                return false;
            }
            
            const startTier = Math.min(...availableTiers);
            const firstTier = milestone.collections.find(c => c.tier === startTier);
            
            playerProgress[milestone.id] = {
                currentTiers: [startTier],
                requirements: firstTier.requirements ? firstTier.requirements.map(req => ({
                    currentCount: 0,
                    completed: false
                })) : [],
                completed: false,
                lastCompleted: 0,
                completedTiers: {}
            };
            
            this.#milestoneProgressDB.set(player.id, playerProgress);
            Logger.log(`Initialized milestone ${milestone.id} for player ${player.name}`, "DEBUG", "MILESTONE");
            return true;
        } catch (error) {
            Logger.log(`Error initializing milestone: ${error}`, "ERROR", "MILESTONE");
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
            Logger.log(`Error getting player progress: ${error}`, "ERROR", "MILESTONE");
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
            Logger.log(`Error saving player progress: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static isTierUnlocked(tierData, progress, doLogging = false) {
        Logger.log(`Checking if Tier unlocked : ${tierData.tier}`, "DEBUG", "MILESTONE");

        if (tierData.unlockedBy === undefined && tierData.unlockedByAny === undefined) {
            Logger.log(`Tier ${tierData.tier} has no unlock conditions, always available`, "DEBUG", "MILESTONE");
            return true;
        }
        
        progress.completedTiers = progress.completedTiers || {};
        Logger.log(`Checking if tier ${tierData.tier} is unlocked. Completed tiers: ${JSON.stringify(progress.completedTiers)}`, "DEBUG", "MILESTONE");
        
        if (tierData.unlockedBy !== undefined) {
            const requiredTiers = Array.isArray(tierData.unlockedBy) 
                ? tierData.unlockedBy 
                : [tierData.unlockedBy];
       
            Logger.log(`Tier ${tierData.tier} requires ALL tiers ${JSON.stringify(requiredTiers)} to be completed`, "DEBUG", "MILESTONE");

            for (const requiredTier of requiredTiers) {
                const tierNum = typeof requiredTier === 'string' ? parseInt(requiredTier) : requiredTier;
                const isCompleted = !!progress.completedTiers[tierNum];
                
                Logger.log(`Required tier ${tierNum} completion status: ${isCompleted}`, "DEBUG", "MILESTONE");
                
                if (!isCompleted) return false;
            }
            return true;
        }
        
        if (tierData.unlockedByAny !== undefined) {
            const anyRequiredTiers = Array.isArray(tierData.unlockedByAny)
                ? tierData.unlockedByAny
                : [tierData.unlockedByAny];
                
            return anyRequiredTiers.some(requiredTier => !!progress.completedTiers[requiredTier]);
        }
        
        return false;
    }

    static getNextUnlockedTier(milestone, progress) {
        progress.completedTiers = progress.completedTiers || {};

        Logger.log(`Getting next unlocked Tiers or milestone : ${milestone.displayName}`, "DEBUG", "MILESTONE");
        
        const unlockedTiers = [];
        
        const allTiers = milestone.collections
            .map(c => c.tier)
            .sort((a, b) => a - b);
        
        for (const tier of allTiers) {
            if (progress.completedTiers[tier]) {
                continue;
            }
            
            const tierData = milestone.collections.find(c => c.tier === tier);
            if (this.isTierUnlocked(tierData, progress, true)) {
                unlockedTiers.push(tier);
            }
        }
        
        return unlockedTiers;
    }

    static async checkAllActiveMilestones(player) {
        try {
            const activations = this.#activatedMilestonesDB.get(player.id) || {};
            
            const allMilestoneIds = [];
            
            for (const [groupId, milestones] of Object.entries(MILESTONES)) {
                for (const milestone of milestones) {
                    if (!milestone.options?.activatedBy || milestone.options.activatedBy.length === 0) {
                        allMilestoneIds.push(milestone.id);
                    }
                }
            }
            
            for (const milestoneId in activations) {
                if (!allMilestoneIds.includes(milestoneId)) {
                    allMilestoneIds.push(milestoneId);
                }
            }

            for (const milestoneId of allMilestoneIds) {
                console.warn(`${milestoneId} is Active`)
            }

            for (const milestoneId of allMilestoneIds) {
                const milestone = MilestoneStorage.getMilestone(milestoneId);
                if (!milestone) continue;
                
                await this.updateMilestoneProgress(player, milestone);
            }
            
            return true;
        } catch (error) {
            Logger.log(`Error checking active milestones: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static async processReferenceTier(player, currentTier) {
        try {
            const referencedMilestoneId = currentTier.reference?.milestoneId;
            if (!referencedMilestoneId) {
                Logger.log(`Reference tier missing milestoneId: ${currentTier.id}`, "ERROR", "MILESTONE");
                return false;
            }
            
            const activationSuccess = await this.activateMilestone(player, referencedMilestoneId);
            if (!activationSuccess) {
                Logger.log(`Failed to activate referenced milestone: ${referencedMilestoneId}`, "ERROR", "MILESTONE");
                return false;
            }
            
            Logger.log(`Successfully activated milestone: ${referencedMilestoneId} from reference tier`, "DEBUG", "MILESTONE");
            
            return true;
        } catch (error) {
            Logger.log(`Error processing reference tier: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static async updateMilestoneProgress(player, milestone) {
        try {
            //player.sendMessage(`Milestone ${milestone.id}`);

            Logger.log(`updating progress for milestone ${milestone.id} for player ${player.name}`, "DEBUG", "MILESTONE");
            if (!milestone?.id) {
                Logger.log("Invalid milestone object", "ERROR", "MILESTONE");
                return false;
            }

            const allProgress = this.#milestoneProgressDB.get(player.id) || {};            
            let progress = allProgress[milestone.id];
            let progressUpdated = false;

            if (!progress) {
                await this.initializePlayerMilestoneIfNeeded(player, milestone);
                progress = (this.#milestoneProgressDB.get(player.id) || {})[milestone.id];
                if (!progress) return false;
            }

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

            const prereqsMet = await this.checkPrerequisitesEfficient(player, milestone, allProgress);
            if (!prereqsMet) {
                return false;
            }

            let keepChecking = true;
            const rewardsToProcess = [];
            const newlyUnlockedTiers = new Set();
            const notifications = [];
            const completedTiersThisUpdate = [];

            const currentTiers = [...progress.currentTiers];
        
        for (const tierNumber of currentTiers) {
            const currentTier = milestone.collections.find(c => c.tier === tierNumber);
            if (!currentTier) continue;
            
            if (currentTier.type === 'milestone_reference') {
                const referenceSuccess = await this.processReferenceTier(player, currentTier);
                
                if (referenceSuccess) {
                    progress.completedTiers = progress.completedTiers || {};
                    progress.completedTiers[currentTier.tier] = {
                        completedAt: Date.now()
                    };
                    
                    progress.currentTiers = progress.currentTiers.filter(t => t !== tierNumber);
                    
                    const referencedMilestone = MilestoneStorage.getMilestone(currentTier.reference.milestoneId);
                    if (referencedMilestone) {
                        notifications.push(`Unlocked milestone: ${referencedMilestone.displayName}`);
                    }
                    
                    if (currentTier.rewards && currentTier.rewards.length > 0) {
                        rewardsToProcess.push(currentTier.rewards);
                    }
                    
                    completedTiersThisUpdate.push(tierNumber);
                    
                    progressUpdated = true;
                }
                
                continue;
            }
            
            const { allRequirementsMet, requirementsUpdated } = await this.checkTierRequirementsNew(
                player,
                currentTier,
                progress
            );
            
            if (requirementsUpdated) {
                progressUpdated = true;
            }

            if (allRequirementsMet) {
                if (currentTier.rewards && currentTier.rewards.length > 0) {
                    rewardsToProcess.push(currentTier.rewards);
                }
                
                progress.completedTiers = progress.completedTiers || {};
                const completedTierNumber = currentTier.tier;
                progress.completedTiers[completedTierNumber] = {
                    completedAt: Date.now()
                };
                
                progress.currentTiers = progress.currentTiers.filter(t => t !== completedTierNumber);
                
                completedTiersThisUpdate.push(completedTierNumber);

                Logger.log(`Completed tier ${completedTierNumber} in milestone ${milestone.id}`, "DEBUG", "MILESTONE");
                Logger.log(`Updated completedTiers: ${JSON.stringify(progress.completedTiers)}`, "DEBUG", "MILESTONE");

                await this.checkAndActivateDependentMilestones(player, milestone.id, currentTier.id);
                
                progressUpdated = true;
            }
        }

        for (const completedTier of completedTiersThisUpdate) {
            const tiersUnlockedByThisCompletion = this.findNewlyUnlockedTiers(
                milestone, completedTier, progress);
            
            tiersUnlockedByThisCompletion.forEach(tier => newlyUnlockedTiers.add(tier));
        }
        
        const allUnlockedTiers = this.getNextUnlockedTier(milestone, progress);
        
        for (const tier of allUnlockedTiers) {
            if (!progress.currentTiers.includes(tier)) {
                progress.currentTiers.push(tier);
                
                const tierData = milestone.collections.find(c => c.tier === tier);
                if (tierData && tierData.requirements) {
                    if (!progress.requirements || progress.requirements.length === 0) {
                        progress.requirements = tierData.requirements.map(req => ({
                            currentCount: 0,
                            completed: false
                        }));
                    }
                }

                // Start timers for any timePassedSince requirements in this tier
                this.#startTierTimers(player, milestone.id, tierData);
                
                progressUpdated = true;
            }
        }
        
            if (progress.currentTiers.length === 0 && Object.keys(progress.completedTiers || {}).length > 0) {
                progress.completed = true;
                progress.lastCompleted = Date.now();
            }

            for (const rewards of rewardsToProcess) {
                await RewardManager.processRewards(player, rewards, "complete");
            }

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

            if (notifications.length > 0) {
                for (const notification of notifications) {
                    player.sendMessage(notification);
                }
            }

            if (progressUpdated) {
                allProgress[milestone.id] = progress;
                this.#milestoneProgressDB.set(player.id, allProgress);
            }

            return true;
        } catch (error) {
            Logger.log(`Error updating milestone progress: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static findNewlyUnlockedTiers(milestone, completedTier, progress) {

    try{

        Logger.log(`Lets find any newly unlocked Tiers for mileStone : ${milestone.displayName} and Tier ${completedTier} `, "DEBUG", "MILESTONE");

        const newlyUnlocked = [];
        progress.completedTiers = progress.completedTiers || {};
        
        for (const collection of milestone.collections) {
            if (progress.completedTiers[collection.tier]) {
                continue;
            }
            
            if (collection.unlockedBy !== undefined) {
                const requiredTiers = Array.isArray(collection.unlockedBy) 
                    ? collection.unlockedBy 
                    : [collection.unlockedBy];
                    
                if (requiredTiers.includes(completedTier)) {
                    const otherRequirements = requiredTiers.filter(t => t !== completedTier);
                    const allOthersMet = otherRequirements.every(t => !!progress.completedTiers[t]);
                    
                    if (allOthersMet) {
                        newlyUnlocked.push(collection.tier);
                    }
                }
            }
            
            if (collection.unlockedByAny !== undefined) {
                const anyOptions = collection.unlockedByAny;
                
                if (typeof anyOptions === 'number' && anyOptions === completedTier) {
                    newlyUnlocked.push(collection.tier);
                    continue;
                }
                
                if (Array.isArray(anyOptions) && !Array.isArray(anyOptions[0])) {
                    if (anyOptions.includes(completedTier)) {
                        newlyUnlocked.push(collection.tier);
                        continue;
                    }
                }
                
                if (Array.isArray(anyOptions) && Array.isArray(anyOptions[0])) {
                    for (const option of anyOptions) {
                        if (Array.isArray(option) && option.includes(completedTier)) {
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
        
        newlyUnlocked.forEach(tier => {
            Logger.log(`Newly unlocked tier: ${tier}`, "DEBUG", "MILESTONE");
        });

        return newlyUnlocked;
    }
    catch (error) {
        Logger.log(`Error finding newly unlocked tiers: ${error}`, "ERROR", "MILESTONE");
        return false;
    }

        
    }

    static async checkTierRequirementsNew(player, tierData, progress) {
        try {
            Logger.log(`Checking Tier Requirements for ${tierData.displayName}`, "DEBUG", "TIER_CHECKING");

            const { requirements } = await RequirementChecker.checkRequirements(player, tierData.requirements || []);
            let requirementsUpdated = false;
            
            if (!progress.requirements || progress.requirements.length === 0) {
                progress.requirements = requirements.map(r => ({
                    currentCount: r.currentValue,
                    completed: r.isCompleted
                }));
                requirementsUpdated = true;
            } else {
                for (let i = 0; i < requirements.length; i++) {
                    if (i >= progress.requirements.length) {
                        progress.requirements.push({
                            currentCount: requirements[i].currentValue,
                            completed: requirements[i].isCompleted
                        });
                        requirementsUpdated = true;
                    } else if (requirements[i].currentValue > progress.requirements[i].currentCount) {
                        progress.requirements[i].currentCount = requirements[i].currentValue;
                        progress.requirements[i].completed = requirements[i].isCompleted;
                        requirementsUpdated = true;
                    }
                }
            }
            
            const allRequirementsMet = requirements.every(r => r.isCompleted);
            
            return { allRequirementsMet, requirementsUpdated };    
               
        } catch (error) {
            Logger.log(`Error checking the New Tier Requirements: ${error}`, "ERROR", "MILESTONE");
            return false;
        }

        
    }   

    static async checkPrerequisitesEfficient(player, milestone, existingProgress) {
        try {
            Logger.log(`Checking prerequisites for ${milestone.id}`, "DEBUG", "MILESTONE");

            if (!milestone.options?.prerequisites || milestone.options.prerequisites.length === 0) {
                Logger.log(`No prerequisites for milestone ${milestone.id}`, "DEBUG", "MILESTONE");
                return true;
            }

            for (const prereq of milestone.options.prerequisites) {
                const questCompletion = await CollectionHandler.isCollectionCompleted(player, prereq.id);
                if (questCompletion) continue;

                const milestoneProgress = existingProgress[prereq.id];
                if (!milestoneProgress?.completed) {
                    Logger.log(`Prerequisite ${prereq.id} not completed on milestone ${milestone.id}`, "DEBUG", "MILESTONE");
                    return false;
                }
            }

            return true;
        } catch (error) {
            Logger.log(`Error checking prerequisites: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    static async checkAndActivateDependentMilestones(player, milestoneId, collectionId) {
        try {
            for (const [groupId, milestones] of Object.entries(MILESTONES)) {
                for (const milestone of milestones) {
                    const isAlreadyActivated = await this.isActivated(player, milestone.id);
                    if (isAlreadyActivated) continue;

                    if (milestone.options?.activatedBy) {
                        const activators = Array.isArray(milestone.options.activatedBy) 
                            ? milestone.options.activatedBy 
                            : [milestone.options.activatedBy];
                        
                        const shouldActivate = activators.some(activator => 
                            activator === milestoneId || 
                            activator === collectionId
                        );
                        
                        if (shouldActivate) {
                            await this.activateMilestone(player, milestone.id);
                            Logger.log(`Activated milestone ${milestone.id} for player ${player.name} via collection completion`, "DEBUG", "MILESTONE");
                                
                            player.sendMessage(`§q§lUnlocked new milestone: §r§q${milestone.displayName}`);
                        }
                    }
                }
            }
            return true;
        } catch (error) {
            Logger.log(`Error checking dependent milestones: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }
}

export class MilestoneStorage {
    static #milestoneDB;

    static initialize() {
        try {
            this.#milestoneDB = new JsonDatabase("skychievments_milestones");
            Logger.log("Milestone Storage initialized", "DEBUG", "MILESTONE");
            // Optionally load defaults on initialization if the DB is empty
            // this.loadDefaultsIfNeeded();
            return true;
        } catch (error) {
            console.warn(`Failed to initialize Milestone Storage: ${error}`);
            return false;
        }
    }

    static getMilestone(id) {
        try {
            // Ensure the database is initialized
            if (!this.#milestoneDB) {
                Logger.log("Milestone database not initialized.", "WARN", "MILESTONE");
                return null;
            }
            return this.#milestoneDB.has(id) ? this.#milestoneDB.get(id) : null;
        } catch (error) {
            Logger.log(`Error getting milestone ${id}: ${error}`, "ERROR", "MILESTONE");
            return null;
        }
    }

    static async saveMilestone(milestone) {
        try {
             // Ensure the database is initialized
            if (!this.#milestoneDB) {
                Logger.log("Milestone database not initialized. Cannot save.", "ERROR", "MILESTONE");
                return false;
            }
            if (!milestone?.id) {
                throw new Error('Invalid milestone object, missing id');
            }
            // Ensure collections is an array
            if (milestone.collections && !Array.isArray(milestone.collections)) {
                 Logger.log(`Milestone ${milestone.id} has invalid collections format. Expected array.`, "WARN", "MILESTONE");
                 // Attempt to fix or skip saving depending on desired behavior
                 // For now, let's log and potentially skip saving this part or the whole milestone
                 // Or ensure the source data in MILESTONES is correct.
            }

            this.#milestoneDB.set(milestone.id, milestone);
            return true;
        } catch (error) {
            // Use milestone?.id for safer logging in case milestone itself is null/undefined
            Logger.log(`Error saving milestone ${milestone?.id}: ${error}`, "ERROR", "MILESTONE");
            return false;
        }
    }

    /**
     * Clears all milestones from storage and reloads them from the configuration file.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    static async resetMilestonesToDefaults() {
        try {
            Logger.log("Starting reset of milestones to defaults...", "INFO", "MILESTONE_STORAGE");

             // Ensure the database is initialized
            if (!this.#milestoneDB) {
                Logger.log("Milestone database not initialized. Cannot reset.", "ERROR", "MILESTONE_STORAGE");
                return false;
            }

            // 1. Clear all existing milestones from storage
            // Assuming JsonDatabase doesn't have a clear method, iterate and delete
            const keys = Array.from(this.#milestoneDB.keys());
            keys.forEach(key => this.#milestoneDB.delete(key));
            // Alternatively, if JsonDatabase allows resetting its internal store:
            // this.#milestoneDB = new JsonDatabase("skychievments_milestones"); // Re-initialize to clear

            Logger.log(`Cleared ${keys.length} existing milestones from storage.`, "DEBUG", "MILESTONE_STORAGE");

            // 2. Reload default milestones from the config file
            let loadedCount = 0;
            let failedCount = 0;
            // Iterate through the groups in MILESTONES
            for (const groupKey in MILESTONES) {
                const milestoneGroup = MILESTONES[groupKey];
                 // Check if the group itself is an array of milestones
                 if (Array.isArray(milestoneGroup)) {
                    for (const milestone of milestoneGroup) {
                        if (milestone && milestone.id) {
                            const saved = await this.saveMilestone(milestone);
                            if (saved) {
                                loadedCount++;
                            } else {
                                failedCount++;
                                Logger.log(`Failed to reload default milestone: ${milestone.id} in group ${groupKey}`, "WARN", "MILESTONE_STORAGE");
                            }
                        } else {
                             failedCount++;
                             Logger.log(`Skipping invalid milestone entry in group ${groupKey}`, "WARN", "MILESTONE_STORAGE");
                        }
                    }
                 } else {
                    Logger.log(`Skipping non-array group in MILESTONES: ${groupKey}`, "WARN", "MILESTONE_STORAGE");
                 }
            }

            if (failedCount > 0) {
                 Logger.log(`Successfully reloaded ${loadedCount} default milestones, but failed to load ${failedCount}.`, "WARN", "MILESTONE_STORAGE");
            } else {
                 Logger.log(`Successfully reloaded ${loadedCount} default milestones.`, "INFO", "MILESTONE_STORAGE");
            }

            return failedCount === 0; // Return true only if all milestones loaded successfully
        } catch (error) {
            Logger.log(`Failed to reset milestones to defaults: ${error}`, "ERROR", "MILESTONE_STORAGE");
            console.error("Milestone Reset Error:", error); // Also log to console for visibility
            return false;
        }
    }

     /**
     * Loads default milestones from the config file if the storage is empty.
     * @returns {Promise<boolean>} True if defaults were loaded or already present, false on error.
     */
    static async loadDefaultsIfNeeded() {
        try {
            if (!this.#milestoneDB) {
                Logger.log("Milestone database not initialized. Cannot load defaults.", "ERROR", "MILESTONE_STORAGE");
                return false;
            }

            const keys = Array.from(this.#milestoneDB.keys());
            if (keys.length === 0) {
                Logger.log("Milestone storage is empty. Loading defaults...", "INFO", "MILESTONE_STORAGE");
                return await this.resetMilestonesToDefaults(); // Use the reset logic to load
            } else {
                Logger.log("Milestone storage already contains data. Skipping default load.", "DEBUG", "MILESTONE_STORAGE");
                return true; // Already populated
            }
        } catch (error) {
            Logger.log(`Error during loadDefaultsIfNeeded: ${error}`, "ERROR", "MILESTONE_STORAGE");
            return false;
        }
    }
}
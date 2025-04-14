// timerManager.js - Specialized tracking system for milestone-specific timers
import { JsonDatabase } from '../database/con-database.js';
import { Logger } from '../utils/logger.js';

/**
 * TimerTracker - Manages time-based milestone requirements
 * This class specifically handles the timePassedSince requirement by tracking
 * when specific milestone events started for individual players.
 */
export class TimerTracker {
    static #timersDB;
    
    /**
     * Initialize the timer tracking system
     */
    static initialize() {
        try {
            this.#timersDB = new JsonDatabase("skychievments_milestone_timers");
            Logger.log("Timer Tracker initialized", "DEBUG", "TIMER");
            return true;
        } catch (error) {
            Logger.log(`Failed to initialize Timer Tracker: ${error}`, "ERROR", "TIMER");
            return false;
        }
    }
    
    /**
     * Start a timer for a specific milestone event
     * @param {object} player - The player object
     * @param {string} milestoneId - The milestone ID
     * @param {string} event - The event to track (e.g. "firstSpawn", "tierCompleted")
     * @return {boolean} Success indicator
     */
    static startTimer(player, milestoneId, event) {
        try {
            const playerTimers = this.#timersDB.get(player.id) || {};
            const timerId = `${milestoneId}_${event}`;
            
            playerTimers[timerId] = {
                startedAt: Date.now(),
                event: event
            };
            
            this.#timersDB.set(player.id, playerTimers);
            Logger.log(`Started timer ${timerId} for player ${player.name}`, "DEBUG", "TIMER");
            return true;
        } catch (error) {
            Logger.log(`Error starting timer: ${error}`, "ERROR", "TIMER");
            return false;
        }
    }
    
    /**
     * Reset a timer for a specific milestone event
     * @param {object} player - The player object
     * @param {string} milestoneId - The milestone ID
     * @param {string} event - The event to reset
     * @return {boolean} Success indicator
     */
    static resetTimer(player, milestoneId, event) {
        return this.startTimer(player, milestoneId, event);
    }
    
    /**
     * Get the number of minutes elapsed since a timer started
     * @param {object} player - The player object
     * @param {string} milestoneId - The milestone ID
     * @param {string} event - The event to check
     * @return {number} Elapsed minutes, or 0 if timer not started
     */
    static getElapsedMinutes(player, milestoneId, event) {
        try {
            const playerTimers = this.#timersDB.get(player.id) || {};
            const timerId = `${milestoneId}_${event}`;
            
            if (!playerTimers[timerId]) {
                Logger.log(`No timer found for ${timerId}`, "DEBUG", "TIMER");
                return 0;
            }
            
            const startTime = playerTimers[timerId].startedAt;
            const elapsedMs = Date.now() - startTime;
            
            // Convert to minutes (ms to minutes)
            const minutes = Math.floor(elapsedMs / (1000 * 60));
            Logger.log(`Timer ${timerId} has been running for ${minutes} minutes`, "DEBUG", "TIMER");
            return minutes;
        } catch (error) {
            Logger.log(`Error getting elapsed time: ${error}`, "ERROR", "TIMER");
            return 0;
        }
    }
    
    /**
     * Check if a timer exists for a player
     * @param {object} player - The player object
     * @param {string} milestoneId - The milestone ID
     * @param {string} event - The event to check
     * @return {boolean} Whether the timer exists
     */
    static hasTimer(player, milestoneId, event) {
        try {
            const playerTimers = this.#timersDB.get(player.id) || {};
            const timerId = `${milestoneId}_${event}`;
            
            return !!playerTimers[timerId];
        } catch (error) {
            Logger.log(`Error checking timer existence: ${error}`, "ERROR", "TIMER");
            return false;
        }
    }
    
    /**
     * Handle special events that should trigger timers
     * @param {object} player - The player object
     * @param {string} eventType - The event type (e.g. "firstSpawn", "milestone_activated")
     * @param {object} eventData - Additional event data
     */
    static handleEvent(player, eventType, eventData = {}) {
        try {
            // Handle initial spawn event
            if (eventType === "firstSpawn") {
                // Start global firstSpawn timer for all milestones that might need it
                this.startTimer(player, "global", "firstSpawn");
                Logger.log(`Started global firstSpawn timer for ${player.name}`, "DEBUG", "TIMER");
            }
            
            // Handle milestone activated event
            if (eventType === "milestone_activated" && eventData.milestoneId) {
                // Start milestone_activated timer for this specific milestone
                this.startTimer(player, eventData.milestoneId, "milestone_activated");
                Logger.log(`Started milestone_activated timer for ${eventData.milestoneId}`, "DEBUG", "TIMER");
            }

            // Handle tier activated event
            if (eventType === "tier_activated" && eventData.milestoneId) {
                const tierId = eventData.tierId || `tier_${eventData.tier}`;
                
                // Start tier_activated timer for this specific tier
                this.startTimer(player, eventData.milestoneId, `${tierId}_activated`);
                Logger.log(`Started tier activation timer for ${eventData.milestoneId}, tier ${tierId}`, "DEBUG", "TIMER");
            }
            
            // Handle tier completed event
            if (eventType === "tier_completed" && eventData.milestoneId && eventData.tierId) {
                const tierId = eventData.tierId;
                this.startTimer(player, eventData.milestoneId, `tier_${tierId}_completed`);
                Logger.log(`Started tier completion timer for ${eventData.milestoneId}, tier ${tierId}`, "DEBUG", "TIMER");
            }
            
            // Handle player death event
            if (eventType === "player_death") {
                this.startTimer(player, "global", "last_death");
                Logger.log(`Started global death timer for ${player.name}`, "DEBUG", "TIMER");
            }

            // Other custom events can be added here
            
        } catch (error) {
            Logger.log(`Error handling timer event: ${error}`, "ERROR", "TIMER");
        }
    }
}
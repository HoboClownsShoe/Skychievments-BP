// scripts/managers/guildManager.js
// Handles guild enrollment, quest progress, and guild points
import { GUILD_GROUPS } from '../config/guildGroups.js';
import { DEFAULT_GUILD_QUESTS } from '../config/guildQuests.js';
import { JsonDatabase } from '../database/con-database.js';
import { RequirementChecker } from './requirementsManager.js';
import { Logger } from '../utils/logger.js';
import { RewardManager } from './rewardManager.js';

export class GuildManager {
    static #guildDB = new JsonDatabase('guild_enrollments');
    static #guildPointsDB = new JsonDatabase('guild_points');
    static #guildProgressDB = new JsonDatabase('guild_quest_progress');
    static MAX_GUILDS = 2;

    // Get enrolled guilds for a player
    static getEnrolledGuilds(player) {
        return this.#guildDB.get(player.id) || [];
    }

    // Enroll a player in a guild (returns true if successful, false if already max)
    static enrollInGuild(player, guildId) {
        let enrolled = this.getEnrolledGuilds(player);
        if (enrolled.includes(guildId)) return true;
        if (enrolled.length >= this.MAX_GUILDS) return false;
        enrolled.push(guildId);
        this.#guildDB.set(player.id, enrolled);
        Logger.log(`${player.name} enrolled in guild ${guildId}`);
        return true;
    }

    // Remove a player from a guild
    static unenrollFromGuild(player, guildId) {
        let enrolled = this.getEnrolledGuilds(player);
        enrolled = enrolled.filter(g => g !== guildId);
        this.#guildDB.set(player.id, enrolled);

        // Remove guild points for this guild
        this.#guildPointsDB.delete(`${player.id}:${guildId}`);

        // Remove quest progress for this guild
        this.#guildProgressDB.delete(`${player.id}:${guildId}`);

        Logger.log(`${player.name} unenrolled from guild ${guildId} and all related data removed`);
    }

    // Get guild points for a player in a guild
    static getGuildPoints(player, guildId) {
        const points = this.#guildPointsDB.get(`${player.id}:${guildId}`);
        return points || 0;
    }

    // Add guild points
    static addGuildPoints(player, guildId, amount) {
        let points = this.getGuildPoints(player, guildId);
        points += amount;
        this.#guildPointsDB.set(`${player.id}:${guildId}`, points);
    }

    // Get progress for a player's quests in a guild
    static getGuildQuestProgress(player, guildId) {
        return this.#guildProgressDB.get(`${player.id}:${guildId}`) || {};
    }

    // Set progress for a player's quests in a guild
    static setGuildQuestProgress(player, guildId, progress) {
        this.#guildProgressDB.set(`${player.id}:${guildId}`, progress);
    }

    // Check and update quest progress for a player in a guild
    static checkGuildQuestProgress(player, guildId) {
        const quests = DEFAULT_GUILD_QUESTS[guildId] || [];
        let progress = this.getGuildQuestProgress(player, guildId);
        let updated = false;
        for (const quest of quests) {
            if (progress[quest.id]?.completed) continue;
            const checkResult = RequirementChecker.checkRequirements(player, quest.requirements);
            if (!progress[quest.id]) {
                progress[quest.id] = { requirements: checkResult.requirements, completed: false };
                updated = true;
            } else {
                for (let i = 0; i < checkResult.requirements.length; i++) {
                    const req = checkResult.requirements[i];
                    let progReq = progress[quest.id].requirements[i];
                    if (!progReq || progReq.currentValue !== req.currentValue || progReq.isCompleted !== req.isCompleted) {
                        progress[quest.id].requirements[i] = req;
                        updated = true;
                    }
                }
            }
            if (checkResult.allCompleted && !progress[quest.id].completed) {
                progress[quest.id].completed = true;
                // Grant all rewards using RewardManager.processRewards
                RewardManager.processRewards(player, quest.rewards, null, { guildId });
                Logger.log(`${player.name} completed guild quest ${quest.id} in ${guildId}`);
                updated = true;
            }
        }
        if (updated) this.setGuildQuestProgress(player, guildId, progress);
        return progress;
    }
}

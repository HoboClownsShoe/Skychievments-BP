// managers/rewardManager.js
import { QuestPointsManager } from './questPointManager.js';
import { Logger } from '../utils/logger.js';
import { sendNotification, showTipToast } from '../utils/toast.js';

export class RewardManager {
    static async processRewards(player, rewards, stage ) {
        try {
            Logger.log(`Processing rewards for ${player.name}`, "DEBUG", "REWARD_MANAGERR");
            for (const reward of rewards) {
                // Process reward based on type
                switch (reward.type) {
                    case 'message':
                        // Only process messages meant for the current stage
                        if (reward.stage === stage) {
                            await this.processMessage(player, reward);
                        }
                        break;
                    case 'point':
                        await QuestPointsManager.addPoints(player, reward.amount);
                        
                        break;
                    case 'command':
                        try {
                            await player.runCommand(reward.command);
                        } catch (error) {
                            Logger.log(`Failed to execute command reward: ${error}`, "ERROR", "REWARD_MANAGER");
                        }
                        break;
                    case 'item':
                        try {
                            await player.runCommandAsync(`give @p ${reward.itemId} ${reward.amount}`);
                        } catch (error) {
                            Logger.log(`Failed to give item reward: ${error}`, "ERROR", "REWARD_MANAGER");
                        }
                        break;
                }
            }
            return true;
        } catch (error) {
            Logger.log(`Error processing rewards: ${error}`, "ERROR", "REWARD_MANAGER");
            return false;
        }
    }

    static async processMessage(player, messageData) {
        try {
            Logger.log(`Processing message reward: ${messageData.content} for ${player.name}`, "DEBUG", "MESSAGE_HANDLER");
            // Currently we only support toast messages
            switch (messageData.messageType?.toLowerCase() || 'toast') {
                case 'toast':            
                    sendNotification(player, messageData.content, 'textures/ui/groupIcons/quest_book.png' , true);
                    break;
            }
        } catch (error) {
            Logger.log(`Error processing message reward: ${error}`, "ERROR", "MESSAGE_HANDLER");
        }
    }
    
}
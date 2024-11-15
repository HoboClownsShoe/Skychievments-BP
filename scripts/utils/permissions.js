// scripts/utils/permissions.js
import { world } from '@minecraft/server';

export class Permissions {
    static isAdmin(player) {
        try {
            const objective = world.scoreboard.getObjective('admin_level');
            if (!objective) return false;
            
            const score = objective.getScore(player);
            return score >= 1;
        } catch {
            return false;
        }
    }
}
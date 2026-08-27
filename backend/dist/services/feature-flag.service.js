"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagService = void 0;
const prisma_1 = require("../prisma");
class FeatureFlagService {
    static defaultFlags = [
        { key: 'ONLINE_PAYMENTS', name: 'Online Payment Gateway', description: 'Enable online student fee payments via gateway', isEnabled: true, category: 'PAYMENTS' },
        { key: 'WHATSAPP_NOTIFICATIONS', name: 'WhatsApp Meta WABA', description: 'Enable direct WhatsApp notification delivery', isEnabled: true, category: 'COMMUNICATION' },
        { key: 'AI_INSIGHTS', name: 'AI & Automated Insights', description: 'Enable natural-language queries and rule-based insights', isEnabled: true, category: 'AI' },
        { key: 'EMERGENCY_BROADCASTS', name: 'Campus Emergency Broadcasts', description: 'Enable instant emergency alerts and banner display', isEnabled: true, category: 'SECURITY' },
        { key: 'PWA_OFFLINE', name: 'Progressive Web App (PWA)', description: 'Enable mobile install prompt and offline shell', isEnabled: true, category: 'GENERAL' },
        { key: 'VISITOR_PRE_REGISTRATION', name: 'Visitor Pre-Registration', description: 'Allow faculty and staff to pre-register campus visitors', isEnabled: true, category: 'SECURITY' },
    ];
    /**
     * 1. Get All Feature Flags (with auto-initialization)
     */
    static async getFeatureFlags() {
        let flags = await prisma_1.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
        if (flags.length === 0) {
            for (const df of this.defaultFlags) {
                await prisma_1.prisma.featureFlag.create({ data: df }).catch(() => { });
            }
            flags = await prisma_1.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
        }
        return flags;
    }
    /**
     * 2. Evaluate Feature Flag Server-Side
     */
    static async isFeatureEnabled(key) {
        const flag = await prisma_1.prisma.featureFlag.findUnique({ where: { key } });
        return flag ? flag.isEnabled : true;
    }
    /**
     * 3. Update Feature Flag with Configuration Audit Log
     */
    static async updateFeatureFlag(key, isEnabled, updatedById, reason) {
        const existing = await prisma_1.prisma.featureFlag.findUnique({ where: { key } });
        const oldValue = existing ? String(existing.isEnabled) : 'undefined';
        const updated = await prisma_1.prisma.featureFlag.upsert({
            where: { key },
            update: { isEnabled, updatedById },
            create: { key, name: key, isEnabled, updatedById },
        });
        // Record in ConfigAuditLog
        await prisma_1.prisma.configAuditLog.create({
            data: {
                configKey: `FEATURE_FLAG:${key}`,
                oldValue,
                newValue: String(isEnabled),
                reason: reason || `Toggled feature flag '${key}' to ${isEnabled}.`,
                updatedById,
            },
        });
        return updated;
    }
    /**
     * 4. Retrieve Configuration Change Audit History
     */
    static async getConfigAuditHistory(limit = 50) {
        return prisma_1.prisma.configAuditLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                updatedBy: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
            },
        });
    }
}
exports.FeatureFlagService = FeatureFlagService;

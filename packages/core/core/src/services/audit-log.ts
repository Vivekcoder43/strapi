import type { Core } from '@strapi/types';

interface AuditLogEntry {
    contentType: string;
    recordId: string;
    action: 'create' | 'update' | 'delete';
    userId?: number;
    payload?: any;
    changedFields?: string[];
}

export const createAuditLogger = (strapi: Core.Strapi) => {
    const isEnabled = () => strapi.config.get('auditLog.enabled', true);
    const getExcludedTypes = () => strapi.config.get('auditLog.excludeContentTypes', []);

    const shouldLog = (contentType: string) => {
        if (!isEnabled()) return false;
        return !getExcludedTypes().includes(contentType);
    };

    const log = async (entry: AuditLogEntry) => {
        if (!shouldLog(entry.contentType)) return;

        await strapi.db.connection('audit_logs').insert({
            content_type: entry.contentType,
            record_id: entry.recordId,
            action: entry.action,
            user_id: entry.userId,
            payload: entry.payload ? JSON.stringify(entry.payload) : null,
            changed_fields: entry.changedFields ? JSON.stringify(entry.changedFields) : null,
            timestamp: new Date(),
        });
    };

    return { log, shouldLog };
};

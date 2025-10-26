import type { Core } from '@strapi/types';
import { createAuditLogger } from './audit-log';

export const registerAuditHooks = (strapi: Core.Strapi) => {
    const auditLogger = createAuditLogger(strapi);

    strapi.documents.use(async (ctx, next) => {
        // Only audit /api requests
        if (!ctx.request.url.startsWith('/api')) {
            return next();
        }

        const { uid, action, params } = ctx;
        await next(); // Execute main operation first

        const userId = ctx.state?.user?.id;
        const result = ctx.result;
        const recordId = result?.id ?? result?.documentId;

        try {
            // CREATE
            if (action === 'create' && result) {
                await auditLogger.log({
                    contentType: uid,
                    recordId,
                    action,
                    userId,
                    payload: result,
                });
            }

            // UPDATE
            else if (action === 'update' && params.documentId) {
                const before = await strapi.documents(uid).findOne({
                    documentId: params.documentId,
                    locale: params.locale,
                });

                if (before && result) {
                    const changedFields = Object.keys(result).filter(
                        key => JSON.stringify(before[key]) !== JSON.stringify(result[key])
                    );

                    await auditLogger.log({
                        contentType: uid,
                        recordId,
                        action,
                        userId,
                        changedFields,
                    });
                }
            }

            // DELETE
            else if (action === 'delete' && params.documentId) {
                const before = await strapi.documents(uid).findOne({
                    documentId: params.documentId,
                    locale: params.locale,
                });

                if (before) {
                    const deleteRecordId = before.id ?? before.documentId;
                    await auditLogger.log({
                        contentType: uid,
                        recordId: deleteRecordId,
                        action,
                        userId,
                        payload: before,
                    });
                }
            }
        } catch (err) {
            strapi.log.error('Audit log error:', err);
        }
    });
};

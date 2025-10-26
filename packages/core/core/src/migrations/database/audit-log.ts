import type { Migration } from '@strapi/database';

export const createAuditLogsTable: Migration = {
    name: 'core::5.1.0-audit-logs',
    async up(trx) {
        const hasTable = await trx.schema.hasTable('audit_logs');
        if (!hasTable) {
            await trx.schema.createTable('audit_logs', (table) => {
                table.increments('id').primary();
                table.string('content_type').notNullable();
                table.string('record_id').notNullable();
                table.enum('action', ['create', 'update', 'delete']).notNullable();
                table.integer('user_id').nullable();
                table.text('payload').nullable();
                table.text('changed_fields').nullable();
                table.timestamp('timestamp').defaultTo(trx.fn.now()).notNullable();

                // Indexes for efficient querying
                table.index(['content_type']);
                table.index(['user_id']);
                table.index(['action']);
                table.index(['timestamp']);
                table.index(['content_type', 'record_id']);
            });
        }
    },
    async down(trx) {
        await trx.schema.dropTableIfExists('audit_logs');
    },
};

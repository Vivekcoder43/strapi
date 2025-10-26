export default {
    async find(ctx: any) {
        const { query } = ctx.request;
        const {
            contentType,
            userId,
            action,
            startDate,
            endDate,
            page = 1,
            pageSize = 25,
            sort = 'timestamp:desc',
        } = query;

        // Build query conditionally
        let baseQuery = strapi.db.connection('audit_logs');
        if (contentType) baseQuery = baseQuery.where('content_type', contentType);
        if (userId) baseQuery = baseQuery.where('user_id', userId);
        if (action) baseQuery = baseQuery.where('action', action);
        if (startDate) baseQuery = baseQuery.where('timestamp', '>=', new Date(startDate));
        if (endDate) baseQuery = baseQuery.where('timestamp', '<=', new Date(endDate));

        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const [sortField, sortOrder] = sort.split(':');

        const [results, total] = await Promise.all([
            baseQuery.clone()
                .orderBy(sortField, sortOrder || 'desc')
                .limit(parseInt(pageSize))
                .offset(offset),
            baseQuery.clone().count('* as count').first(),
        ]);

        const parsedResults = results.map((log: any) => ({
            ...log,
            payload: log.payload ? JSON.parse(log.payload) : null,
            changed_fields: log.changed_fields ? JSON.parse(log.changed_fields) : null,
        }));

        ctx.body = {
            data: parsedResults,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: total?.count || 0,
                pageCount: Math.ceil((total?.count || 0) / parseInt(pageSize)),
            },
        };
    },
};

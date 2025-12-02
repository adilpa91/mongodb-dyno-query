import { z } from 'zod';
import { QueryConfig } from './query-builder';

// Enum validation
// We define the enum values manually to avoid circular dependency with query-builder.ts
export const OperatorSchema = z.enum([
    '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
    '$and', '$or', '$not', '$nor',
    '$exists', '$type',
    '$regex',
    '$all', '$elemMatch', '$size'
]);

// Base schemas for recursive definitions
const BaseConditionSchema = z.object({});

// Field Condition Schema
export const FieldConditionSchema = z.object({
    field: z.string().min(1),
    operator: z.union([OperatorSchema, z.string()]),
    value: z.any()
});

// Date Range Condition Schema
export const DateRangeConditionSchema = z.object({
    field: z.string().min(1),
    from: z.union([z.date(), z.string()]).optional(),
    to: z.union([z.date(), z.string()]).optional()
}).strict();

// Recursive Logical Condition Schema
// We need to use z.lazy() for recursive types
export const QueryConditionSchema: z.ZodType<any> = z.lazy(() =>
    z.union([
        FieldConditionSchema,
        LogicalConditionSchema,
        DateRangeConditionSchema
    ])
);

export const LogicalConditionSchema = z.object({
    operator: z.enum(['$and', '$or', '$nor']),
    conditions: z.array(QueryConditionSchema).min(1)
});

// Main Query Config Schema
export const QueryConfigSchema = z.object({
    staticFilters: z.record(z.string(), z.any()).optional(),
    conditions: z.array(QueryConditionSchema).optional(),
    fieldMappings: z.record(z.string(), z.string()).optional(),
    dateRanges: z.array(DateRangeConditionSchema).optional()
});

/**
 * Validate a query configuration object
 * @throws ZodError if validation fails
 */
export function validateConfig(config: unknown): QueryConfig {
    return QueryConfigSchema.parse(config) as QueryConfig;
}

/**
 * Safe validate a query configuration object
 * @returns result object with success boolean and data or error
 */
export function safeValidateConfig(config: unknown) {
    return QueryConfigSchema.safeParse(config);
}

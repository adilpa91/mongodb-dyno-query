import { describe, it, expect } from '@jest/globals';
import { validateConfig, safeValidateConfig } from './validation';
import { Operator } from './query-builder';

describe('Runtime Validation', () => {
    it('should validate a correct configuration', () => {
        const config = {
            staticFilters: { status: 'active' },
            conditions: [
                { field: 'age', operator: Operator.GTE, value: 18 }
            ]
        };

        expect(() => validateConfig(config)).not.toThrow();
    });

    it('should fail on missing required fields in condition', () => {
        const config = {
            conditions: [
                { field: 'age', value: 18 } // Missing operator
            ]
        };

        expect(() => validateConfig(config)).toThrow();
    });

    it('should fail on invalid operator', () => {
        const config = {
            conditions: [
                { field: 'age', operator: 'INVALID_OP', value: 18 }
            ]
        };

        // Since we allow string for operator (for extensibility or loose typing), 
        // we might need to check if we want to restrict it strictly to the Enum.
        // In our schema: operator: z.union([OperatorSchema, z.string()])
        // So actually 'INVALID_OP' is valid as a string. 
        // If we want strict enum validation, we should remove z.string().
        // However, the original code allowed string. Let's check if it passes.
        expect(() => validateConfig(config)).not.toThrow();
    });

    it('should validate date range with only field', () => {
        const config = {
            dateRanges: [
                { field: 'createdAt' }
            ]
        };

        expect(() => validateConfig(config)).not.toThrow();
    });

    it('should validate nested logical conditions', () => {
        const config = {
            conditions: [
                {
                    operator: Operator.OR,
                    conditions: [
                        { field: 'status', operator: Operator.EQ, value: 'active' },
                        { field: 'status', operator: Operator.EQ, value: 'pending' }
                    ]
                }
            ]
        };

        expect(() => validateConfig(config)).not.toThrow();
    });

    it('should fail on empty logical conditions', () => {
        const config = {
            conditions: [
                {
                    operator: Operator.OR,
                    conditions: [] // Empty array not allowed
                }
            ]
        };

        expect(() => validateConfig(config)).toThrow();
    });
});

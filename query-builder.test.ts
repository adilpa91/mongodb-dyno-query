/**
 * Query Builder Test Suite
 * 
 * Comprehensive tests for the Query Builder Engine
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { QueryBuilder, QueryConfig, Operator, field, and, or, nor, dateRange } from './query-builder';

describe('QueryBuilder', () => {
  
  // ============================================================================
  // Basic Query Building
  // ============================================================================
  
  describe('Basic Query Building', () => {
    it('should build query with static filters only', () => {
      const config: QueryConfig = {
        staticFilters: {
          status: 'active',
          deleted: false
        }
      };

      const query = QueryBuilder.build(config);

      expect(query).toEqual({
        status: 'active',
        deleted: false
      });
    });

    it('should build query with field mappings', () => {
      const config: QueryConfig = {
        fieldMappings: {
          userId: 'userId',
          accountId: 'accountId'
        }
      };

      const data = {
        userId: '12345',
        accountId: 'acc-67890'
      };

      const query = QueryBuilder.build(config, data);

      expect(query).toEqual({
        userId: '12345',
        accountId: 'acc-67890'
      });
    });

    it('should combine static filters and field mappings', () => {
      const config: QueryConfig = {
        staticFilters: {
          status: 'active'
        },
        fieldMappings: {
          userId: 'userId'
        }
      };

      const data = {
        userId: '12345'
      };

      const query = QueryBuilder.build(config, data);

      expect(query).toEqual({
        status: 'active',
        userId: '12345'
      });
    });

    it('should skip undefined field mappings', () => {
      const config: QueryConfig = {
        fieldMappings: {
          userId: 'userId',
          accountId: 'accountId'
        }
      };

      const data = {
        userId: '12345'
        // accountId is undefined
      };

      const query = QueryBuilder.build(config, data);

      expect(query).toEqual({
        userId: '12345'
      });
      expect(query.accountId).toBeUndefined();
    });
  });

  // ============================================================================
  // Date Range Queries
  // ============================================================================
  
  describe('Date Range Queries', () => {
    it('should build query with both from and to dates', () => {
      const config: QueryConfig = {
        dateRanges: [
          { field: 'createdAt' }
        ]
      };

      const data = {
        createdAt: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31')
        }
      };

      const query = QueryBuilder.build(config, data);

      expect(query.createdAt).toBeDefined();
      expect(query.createdAt.$gte).toEqual(new Date('2024-01-01'));
      expect(query.createdAt.$lte).toEqual(new Date('2024-12-31'));
    });

    it('should build query with only from date', () => {
      const config: QueryConfig = {
        dateRanges: [
          { field: 'createdAt' }
        ]
      };

      const data = {
        createdAt: {
          from: new Date('2024-01-01')
        }
      };

      const query = QueryBuilder.build(config, data);

      expect(query.createdAt).toBeDefined();
      expect(query.createdAt.$gte).toEqual(new Date('2024-01-01'));
      expect(query.createdAt.$lte).toBeUndefined();
    });

    it('should build query with only to date', () => {
      const config: QueryConfig = {
        dateRanges: [
          { field: 'createdAt' }
        ]
      };

      const data = {
        createdAt: {
          to: new Date('2024-12-31')
        }
      };

      const query = QueryBuilder.build(config, data);

      expect(query.createdAt).toBeDefined();
      expect(query.createdAt.$lte).toEqual(new Date('2024-12-31'));
      expect(query.createdAt.$gte).toBeUndefined();
    });

    it('should skip date ranges without data', () => {
      const config: QueryConfig = {
        dateRanges: [
          { field: 'createdAt' },
          { field: 'updatedAt' }
        ]
      };

      const data = {
        createdAt: {
          from: new Date('2024-01-01')
        }
        // updatedAt is not provided
      };

      const query = QueryBuilder.build(config, data);

      expect(query.createdAt).toBeDefined();
      expect(query.updatedAt).toBeUndefined();
    });

    it('should handle multiple date ranges', () => {
      const config: QueryConfig = {
        dateRanges: [
          { field: 'createdAt' },
          { field: 'updatedAt' },
          { field: 'completedAt' }
        ]
      };

      const data = {
        createdAt: { from: new Date('2024-01-01') },
        updatedAt: { from: new Date('2024-06-01'), to: new Date('2024-12-31') },
        completedAt: { to: new Date('2024-12-31') }
      };

      const query = QueryBuilder.build(config, data);

      expect(query.createdAt).toBeDefined();
      expect(query.updatedAt).toBeDefined();
      expect(query.completedAt).toBeDefined();
    });
  });

  // ============================================================================
  // Simple Conditions
  // ============================================================================
  
  describe('Simple Conditions', () => {
    it('should build query with EQ operator', () => {
      const config: QueryConfig = {
        conditions: [
          field('status', Operator.EQ, 'active')
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.status).toEqual('active');
    });

    it('should build query with comparison operators', () => {
      const config: QueryConfig = {
        conditions: [
          field('priority', Operator.GTE, 3),
          field('age', Operator.LTE, 65)
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$and).toBeDefined();
      expect(query.$and).toHaveLength(2);
      expect(query.$and[0]).toEqual({ priority: { $gte: 3 } });
      expect(query.$and[1]).toEqual({ age: { $lte: 65 } });
    });

    it('should build query with IN operator', () => {
      const config: QueryConfig = {
        conditions: [
          field('status', Operator.IN, ['active', 'pending', 'in-progress'])
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.status).toEqual({
        $in: ['active', 'pending', 'in-progress']
      });
    });

    it('should build query with EXISTS operator', () => {
      const config: QueryConfig = {
        conditions: [
          field('assignedTo', Operator.EXISTS, true)
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.assignedTo).toEqual({ $exists: true });
    });

    it('should inject data values with $ prefix', () => {
      const config: QueryConfig = {
        conditions: [
          field('status', Operator.EQ, '$userStatus'),
          field('priority', Operator.GTE, '$minPriority')
        ]
      };

      const data = {
        userStatus: 'active',
        minPriority: 3
      };

      const query = QueryBuilder.build(config, data);

      expect(query.$and).toBeDefined();
      expect(query.$and).toContainEqual({ status: 'active' });
      expect(query.$and).toContainEqual({ priority: { $gte: 3 } });
    });

    it('should skip conditions with undefined data references', () => {
      const config: QueryConfig = {
        conditions: [
          field('status', Operator.EQ, '$userStatus'),
          field('priority', Operator.GTE, '$minPriority')
        ]
      };

      const data = {
        userStatus: 'active'
        // minPriority is undefined
      };

      const query = QueryBuilder.build(config, data);

      expect(query.status).toEqual('active');
      expect(query.priority).toBeUndefined();
    });
  });

  // ============================================================================
  // OR Conditions
  // ============================================================================
  
  describe('OR Conditions', () => {
    it('should build simple OR query', () => {
      const config: QueryConfig = {
        conditions: [
          or(
            field('status', Operator.EQ, 'active'),
            field('status', Operator.EQ, 'pending')
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$or).toBeDefined();
      expect(query.$or).toHaveLength(2);
      expect(query.$or[0]).toEqual({ status: 'active' });
      expect(query.$or[1]).toEqual({ status: 'pending' });
    });

    it('should build OR query with multiple fields', () => {
      const config: QueryConfig = {
        conditions: [
          or(
            field('status', Operator.EQ, 'active'),
            field('priority', Operator.EQ, 'urgent'),
            field('type', Operator.EQ, 'emergency')
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$or).toHaveLength(3);
    });
  });

  // ============================================================================
  // AND Conditions
  // ============================================================================
  
  describe('AND Conditions', () => {
    it('should build nested AND query', () => {
      const config: QueryConfig = {
        conditions: [
          and(
            field('status', Operator.EQ, 'active'),
            field('priority', Operator.GTE, 3)
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$and).toBeDefined();
      expect(query.$and).toHaveLength(2);
    });

    it('should flatten single AND condition', () => {
      const config: QueryConfig = {
        conditions: [
          and(
            field('status', Operator.EQ, 'active')
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.status).toEqual('active');
      expect(query.$and).toBeUndefined();
    });
  });

  // ============================================================================
  // Nested Conditions
  // ============================================================================
  
  describe('Nested Conditions', () => {
    it('should build nested AND/OR query', () => {
      const config: QueryConfig = {
        conditions: [
          or(
            and(
              field('status', Operator.EQ, 'active'),
              field('priority', Operator.GTE, 3)
            ),
            and(
              field('status', Operator.EQ, 'pending'),
              field('assignedTo', Operator.EXISTS, true)
            )
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$or).toBeDefined();
      expect(query.$or).toHaveLength(2);
      expect(query.$or[0].$and).toBeDefined();
      expect(query.$or[1].$and).toBeDefined();
    });

    it('should build deeply nested conditions', () => {
      const config: QueryConfig = {
        conditions: [
          or(
            and(
              field('status', Operator.EQ, 'active'),
              or(
                field('priority', Operator.GTE, 3),
                field('type', Operator.EQ, 'urgent')
              )
            ),
            field('featured', Operator.EQ, true)
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$or).toBeDefined();
      expect(query.$or[0].$and).toBeDefined();
      expect(query.$or[0].$and[1].$or).toBeDefined();
    });
  });

  // ============================================================================
  // NOR Conditions
  // ============================================================================
  
  describe('NOR Conditions', () => {
    it('should build NOR query', () => {
      const config: QueryConfig = {
        conditions: [
          nor(
            field('status', Operator.EQ, 'deleted'),
            field('status', Operator.EQ, 'archived')
          )
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.$nor).toBeDefined();
      expect(query.$nor).toHaveLength(2);
    });
  });

  // ============================================================================
  // Array Operations
  // ============================================================================
  
  describe('Array Operations', () => {
    it('should build query with ALL operator', () => {
      const config: QueryConfig = {
        conditions: [
          field('tags', Operator.ALL, ['urgent', 'review'])
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.tags).toEqual({ $all: ['urgent', 'review'] });
    });

    it('should build query with SIZE operator', () => {
      const config: QueryConfig = {
        conditions: [
          field('items', Operator.SIZE, 5)
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.items).toEqual({ $size: 5 });
    });

    it('should build query with ELEM_MATCH operator', () => {
      const config: QueryConfig = {
        conditions: [
          field('history', Operator.ELEM_MATCH, {
            status: 'completed',
            date: { $gte: new Date('2024-01-01') }
          })
        ]
      };

      const query = QueryBuilder.build(config);

      expect(query.history.$elemMatch).toBeDefined();
      expect(query.history.$elemMatch.status).toEqual('completed');
    });
  });

  // ============================================================================
  // Complex Real-World Scenarios
  // ============================================================================
  
  describe('Complex Real-World Scenarios', () => {
    it('should build advanced order query', () => {
      const config: QueryConfig = {
        staticFilters: {
          channel: 'online',
          archived: false
        },
        fieldMappings: {
          customerId: 'customerId'
        },
        dateRanges: [
          { field: 'orderDate' }
        ],
        conditions: [
          or(
            field('status', Operator.EQ, 'fulfilled'),
            and(
              field('status', Operator.EQ, 'in-progress'),
              field('priority', Operator.GTE, '$minPriority')
            )
          )
        ]
      };

      const data = {
        customerId: 'cust-123',
        orderDate: {
          from: new Date('2025-01-01'),
          to: new Date('2025-06-30')
        },
        minPriority: 3
      };

      const query = QueryBuilder.build(config, data);

      expect(query.channel).toEqual('online');
      expect(query.archived).toEqual(false);
      expect(query.customerId).toEqual('cust-123');
      expect(query.orderDate).toBeDefined();
      expect(query.$or).toBeDefined();
    });

    it('should build e-commerce product query', () => {
      const config: QueryConfig = {
        staticFilters: {
          published: true
        },
        conditions: [
          or(
            field('stock', Operator.GT, 0),
            and(
              field('stock', Operator.EQ, 0),
              field('backordersAllowed', Operator.EQ, true)
            )
          ),
          field('price', Operator.GTE, '$minPrice'),
          field('price', Operator.LTE, '$maxPrice'),
          field('category', Operator.IN, '$categories')
        ]
      };

      const data = {
        minPrice: 10,
        maxPrice: 100,
        categories: ['electronics', 'accessories']
      };

      const query = QueryBuilder.build(config, data);

      expect(query.published).toEqual(true);
      expect(query.$and).toBeDefined();
      expect(query.$and.length).toBeGreaterThan(3);
    });

    it('should build role-based access query', () => {
      const config: QueryConfig = {
        conditions: [
          or(
            field('role', Operator.EQ, 'admin'),
            and(
              field('role', Operator.EQ, 'manager'),
              field('teamId', Operator.EQ, '$userTeamId')
            ),
            and(
              field('role', Operator.EQ, 'user'),
              field('assignedTo', Operator.EQ, '$userId')
            )
          )
        ]
      };

      const data = {
        role: 'manager',
        userTeamId: 'team-123',
        userId: 'user-456'
      };

      const query = QueryBuilder.build(config, data);

      expect(query.$or).toBeDefined();
      expect(query.$or).toHaveLength(3);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  
  describe('Edge Cases', () => {
    it('should handle empty config', () => {
      const config: QueryConfig = {};
      const query = QueryBuilder.build(config);

      expect(query).toEqual({});
    });

    it('should handle empty data', () => {
      const config: QueryConfig = {
        fieldMappings: {
          userId: 'userId'
        }
      };

      const query = QueryBuilder.build(config, {});

      expect(query).toEqual({});
    });

    it('should handle null values in data', () => {
      const config: QueryConfig = {
        fieldMappings: {
          userId: 'userId',
          accountId: 'accountId'
        }
      };

      const data = {
        userId: '12345',
        accountId: null
      };

      const query = QueryBuilder.build(config, data);

      expect(query.userId).toEqual('12345');
      expect(query.accountId).toBeUndefined();
    });

    it('should handle nested data paths', () => {
      const config: QueryConfig = {
        fieldMappings: {
          accountId: 'user.account.id'
        }
      };

      const data = {
        user: {
          account: {
            id: 'acc-123'
          }
        }
      };

      const query = QueryBuilder.build(config, data);

      expect(query.accountId).toEqual('acc-123');
    });
  });
});

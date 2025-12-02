/**
 * Query Builder Examples
 * 
 * Comprehensive examples demonstrating various query patterns
 */

import { QueryBuilder, Operator, field, and, or, nor, dateRange, QueryConfig } from './query-builder';
import { QueryConfigManager } from './query-config-manager';

// ============================================================================
// Example 1: Simple Query with Static Filters
// ============================================================================
export function example1_SimpleQuery() {
  console.log('\n=== Example 1: Simple Query ===\n');

  const config: QueryConfig = {
    staticFilters: {
      status: 'active',
      channel: 'online'
    },
    fieldMappings: {
      customerId: 'customerId',
      orderId: 'orderId'
    }
  };

  const data = {
    customerId: 'cust-12345',
    orderId: 'order-67890'
  };

  const query = QueryBuilder.build(config, data);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "status": "active",
  //   "channel": "online",
  //   "customerId": "cust-12345",
  //   "orderId": "order-67890"
  // }
}

// ============================================================================
// Example 2: Query with Optional Date Ranges
// ============================================================================
export function example2_DateRanges() {
  console.log('\n=== Example 2: Date Ranges ===\n');

  const config: QueryConfig = {
    staticFilters: {
      status: 'fulfilled'
    },
    fieldMappings: {
      customerId: 'customerId'
    },
    dateRanges: [
      { field: 'orderDate' },
      { field: 'lastUpdated' },
      { field: 'createdAt' },
      { field: 'deliveredAt' }
    ]
  };

  const data = {
    customerId: 'cust-12345',
    orderDate: {
      from: new Date('2025-01-01'),
      to: new Date('2025-06-30')
    },
    lastUpdated: {
      from: new Date('2025-04-01')
      // No 'to' - still works
    }
    // createdAt and completedAt not provided - will be excluded
  };

  const query = QueryBuilder.build(config, data);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "status": "fulfilled",
  //   "customerId": "cust-12345",
  //   "orderDate": {
  //     "$gte": "2025-01-01",
  //     "$lte": "2025-06-30"
  //   },
  //   "lastUpdated": {
  //     "$gte": "2025-04-01"
  //   }
  // }
}

// ============================================================================
// Example 3: Complex AND Conditions
// ============================================================================
export function example3_AndConditions() {
  console.log('\n=== Example 3: AND Conditions ===\n');

  const config: QueryConfig = {
    conditions: [
      field('status', Operator.EQ, '$status'),
      field('priority', Operator.GTE, '$minPriority'),
      field('assignedTo', Operator.IN, '$assignedUsers')
    ]
  };

  const data = {
    status: 'active',
    minPriority: 3,
    assignedUsers: ['user1', 'user2', 'user3']
  };

  const query = QueryBuilder.build(config, data);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "$and": [
  //     { "status": "active" },
  //     { "priority": { "$gte": 3 } },
  //     { "assignedTo": { "$in": ["user1", "user2", "user3"] } }
  //   ]
  // }
}

// ============================================================================
// Example 4: Complex OR Conditions
// ============================================================================
export function example4_OrConditions() {
  console.log('\n=== Example 4: OR Conditions ===\n');

  const config: QueryConfig = {
    staticFilters: {
      deleted: false
    },
    conditions: [
      or(
        field('status', Operator.EQ, 'pending'),
        field('status', Operator.EQ, 'in-progress'),
        field('priority', Operator.EQ, 'urgent')
      )
    ]
  };

  const query = QueryBuilder.build(config);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "deleted": false,
  //   "$or": [
  //     { "status": "pending" },
  //     { "status": "in-progress" },
  //     { "priority": "urgent" }
  //   ]
  // }
}

// ============================================================================
// Example 5: Nested AND/OR Conditions
// ============================================================================
export function example5_NestedConditions() {
  console.log('\n=== Example 5: Nested AND/OR ===\n');

  // Query: (status = 'active' AND priority >= 3) OR (status = 'pending' AND assignedTo exists)
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
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "$or": [
  //     {
  //       "$and": [
  //         { "status": "active" },
  //         { "priority": { "$gte": 3 } }
  //       ]
  //     },
  //     {
  //       "$and": [
  //         { "status": "pending" },
  //         { "assignedTo": { "$exists": true } }
  //       ]
  //     }
  //   ]
  // }
}

// ============================================================================
// Example 6: Advanced Order Query
// ============================================================================
export function example6_AdvancedOrderQuery() {
  console.log('\n=== Example 6: Advanced Order Query ===\n');

  const config: QueryConfig = {
    staticFilters: {
      channel: 'online',
      archived: false
    },
    fieldMappings: {
      customerId: 'customerId',
      orderId: 'orderId'
    },
    dateRanges: [
      { field: 'orderDate' },
      { field: 'lastUpdated' },
      { field: 'createdAt' }
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
    customerId: 'cust-12345',
    orderId: 'order-67890',
    orderDate: {
      from: new Date('2025-01-01'),
      to: new Date('2025-06-30')
    },
    minPriority: 3
  };

  const query = QueryBuilder.build(config, data);
  console.log('Query:', JSON.stringify(query, null, 2));
}

// ============================================================================
// Example 7: Array Operations
// ============================================================================
export function example7_ArrayOperations() {
  console.log('\n=== Example 7: Array Operations ===\n');

  const config: QueryConfig = {
    conditions: [
      field('tags', Operator.ALL, ['urgent', 'review']),
      field('items', Operator.SIZE, 3),
      field('activity', Operator.ELEM_MATCH, {
        status: 'completed',
        date: { $gte: new Date('2025-01-01') }
      })
    ]
  };

  const query = QueryBuilder.build(config);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "$and": [
  //     { "tags": { "$all": ["urgent", "review"] } },
  //     { "items": { "$size": 3 } },
  //     {
  //       "activity": {
  //         "$elemMatch": {
  //           "status": "completed",
  //           "date": { "$gte": "2025-01-01" }
  //         }
  //       }
  //     }
  //   ]
  // }
}

// ============================================================================
// Example 8: Text Search with Regex
// ============================================================================
export function example8_TextSearch() {
  console.log('\n=== Example 8: Text Search ===\n');

  const config: QueryConfig = {
    conditions: [
      field('customerName', Operator.REGEX, '$searchTerm'),
      field('status', Operator.NE, 'deleted')
    ]
  };

  const data = {
    searchTerm: '^Alex.*River$'
  };

  const query = QueryBuilder.build(config, data);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "$and": [
  //     { "customerName": { "$regex": "^Alex.*River$" } },
  //     { "status": { "$ne": "deleted" } }
  //   ]
  // }
}

// ============================================================================
// Example 9: NOR (None of) Conditions
// ============================================================================
export function example9_NorConditions() {
  console.log('\n=== Example 9: NOR Conditions ===\n');

  // Query: Find records that are neither deleted nor archived
  const config: QueryConfig = {
    conditions: [
      nor(
        field('status', Operator.EQ, 'deleted'),
        field('status', Operator.EQ, 'archived'),
        field('hidden', Operator.EQ, true)
      )
    ]
  };

  const query = QueryBuilder.build(config);
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Output:
  // {
  //   "$nor": [
  //     { "status": "deleted" },
  //     { "status": "archived" },
  //     { "hidden": true }
  //   ]
  // }
}

// ============================================================================
// Example 10: Dynamic Query Based on User Role
// ============================================================================
export function example10_RoleBasedQuery() {
  console.log('\n=== Example 10: Role-Based Query ===\n');

  const config: QueryConfig = {
    staticFilters: {
      accessLevel: 'standard'
    },
    conditions: [
      or(
        // Admin can see all
        field('role', Operator.EQ, 'admin'),
        // Manager can see their team
        and(
          field('role', Operator.EQ, 'manager'),
          field('teamId', Operator.EQ, '$userTeamId')
        ),
        // Regular user can only see their assigned items
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
  console.log('Query:', JSON.stringify(query, null, 2));
}

// ============================================================================
// Example 11: Using with QueryConfigManager
// ============================================================================
export async function example11_WithConfigManager() {
  console.log('\n=== Example 11: With Config Manager ===\n');

  // This example shows how to use the QueryConfigManager
  // Assumes you have a MongoDB connection

  /*
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('myapp');
  
  const configManager = new QueryConfigManager(db);

  // Save a configuration
  await configManager.saveConfig({
    name: 'order-query',
    description: 'Standard order query with filters',
    tags: ['orders', 'reporting'],
    staticFilters: {
      channel: 'online',
      archived: false
    },
    fieldMappings: {
      customerId: 'customerId',
      orderId: 'orderId'
    },
    dateRanges: [
      { field: 'orderDate' },
      { field: 'lastUpdated' }
    ]
  });

  // Build query using saved configuration
  const query = await configManager.buildQuery('order-query', {
    customerId: 'cust-123',
    orderDate: {
      from: new Date('2025-01-01'),
      to: new Date('2025-06-30')
    }
  });

  console.log('Query:', JSON.stringify(query, null, 2));
  */

  console.log('See code comments for implementation');
}

// ============================================================================
// Example 12: Complex E-commerce Query
// ============================================================================
export function example12_EcommerceQuery() {
  console.log('\n=== Example 12: E-commerce Query ===\n');

  // Find products that are:
  // - In stock OR (out of stock but accepting backorders)
  // - Price within range
  // - Category matches
  // - Has reviews >= 4 stars OR is a featured product
  
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
      field('category', Operator.IN, '$categories'),
      or(
        field('avgRating', Operator.GTE, 4),
        field('featured', Operator.EQ, true)
      )
    ]
  };

  const data = {
    minPrice: 10,
    maxPrice: 100,
    categories: ['electronics', 'accessories']
  };

  const query = QueryBuilder.build(config, data);
  console.log('Query:', JSON.stringify(query, null, 2));
}

// ============================================================================
// Run all examples
// ============================================================================
export function runAllExamples() {
  example1_SimpleQuery();
  example2_DateRanges();
  example3_AndConditions();
  example4_OrConditions();
  example5_NestedConditions();
  example6_AdvancedOrderQuery();
  example7_ArrayOperations();
  example8_TextSearch();
  example9_NorConditions();
  example10_RoleBasedQuery();
  example12_EcommerceQuery();
}

// Uncomment to run examples
// runAllExamples();

/**
 * Test null value handling in query builder
 */

import { QueryBuilder, Operator, field, or, and, QueryConfig } from './query-builder';

// Config with OR condition for deliveredAt
const config: QueryConfig = {
  staticFilters: {
    status: 'fulfilled'
  },
  dateRanges: [
    { field: 'orderDate' },
    { field: 'updatedAt' }
  ],
  conditions: [
    field('customerSegments', Operator.IN, '$segments'),
    or(
      field('deliveredAt', Operator.EQ, '$deliveredAt.exactDate'),
      and(
        field('deliveredAt', Operator.GTE, '$deliveredAt.from'),
        field('deliveredAt', Operator.LTE, '$deliveredAt.to')
      )
    )
  ]
};

console.log('\n=== Test 1: Exact Date (from/to should be ignored) ===');
const data1 = {
  segments: ['vip', 'loyal', 'wholesale'],
  deliveredAt: {
    exactDate: new Date('2025-11-25')
  },
  orderDate: {
    from: new Date('2025-01-01'),
    to: new Date('2025-12-31')
  },
  updatedAt: {
    from: new Date('2025-06-01')
  }
};

const query1 = QueryBuilder.build(config, data1);
console.log('Input Data:', JSON.stringify(data1, null, 2));
console.log('Generated Query:', JSON.stringify(query1, null, 2));

console.log('\n=== Test 2: Date Range (exactDate should be ignored) ===');
const data2 = {
  segments: ['vip'],
  deliveredAt: {
    from: new Date('2025-10-01'),
    to: new Date('2025-10-31')
  },
  orderDate: {
    from: new Date('2025-01-01')
  }
};

const query2 = QueryBuilder.build(config, data2);
console.log('Input Data:', JSON.stringify(data2, null, 2));
console.log('Generated Query:', JSON.stringify(query2, null, 2));

console.log('\n=== Test 3: No deliveredAt (entire OR should be skipped) ===');
const data3 = {
  segments: ['vip', 'subscriber']
};

const query3 = QueryBuilder.build(config, data3);
console.log('Input Data:', JSON.stringify(data3, null, 2));
console.log('Generated Query:', JSON.stringify(query3, null, 2));

console.log('\n=== Test 4: Only deliveredAt.from (partial range) ===');
const data4 = {
  segments: ['vip'],
  deliveredAt: {
    from: new Date('2025-10-01')
    // No 'to' date
  }
};

const query4 = QueryBuilder.build(config, data4);
console.log('Input Data:', JSON.stringify(data4, null, 2));
console.log('Generated Query:', JSON.stringify(query4, null, 2));

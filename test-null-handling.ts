/**
 * Test null value handling in query builder
 */

import { QueryBuilder, Operator, field, or, and, QueryConfig } from './query-builder';

// Config with OR condition for completedAt
const config: QueryConfig = {
  staticFilters: {
    status: 'completed'
  },
  dateRanges: [
    { field: 'createdAt' },
    { field: 'updatedAt' }
  ],
  conditions: [
    field('programGroups', Operator.IN, '$programGroups'),
    or(
      field('completedAt', Operator.EQ, '$completedAt.exactDate'),
      and(
        field('completedAt', Operator.GTE, '$completedAt.from'),
        field('completedAt', Operator.LTE, '$completedAt.to')
      )
    )
  ]
};

console.log('\n=== Test 1: Exact Date (from/to should be ignored) ===');
const data1 = {
  programGroups: ['CMR', 'CCM', 'RPM'],
  completedAt: {
    exactDate: new Date('2024-11-25')
  },
  createdAt: {
    from: new Date('2024-01-01'),
    to: new Date('2024-12-31')
  },
  updatedAt: {
    from: new Date('2024-06-01')
  }
};

const query1 = QueryBuilder.build(config, data1);
console.log('Input Data:', JSON.stringify(data1, null, 2));
console.log('Generated Query:', JSON.stringify(query1, null, 2));

console.log('\n=== Test 2: Date Range (exactDate should be ignored) ===');
const data2 = {
  programGroups: ['CMR'],
  completedAt: {
    from: new Date('2024-10-01'),
    to: new Date('2024-10-31')
  },
  createdAt: {
    from: new Date('2024-01-01')
  }
};

const query2 = QueryBuilder.build(config, data2);
console.log('Input Data:', JSON.stringify(data2, null, 2));
console.log('Generated Query:', JSON.stringify(query2, null, 2));

console.log('\n=== Test 3: No completedAt (entire OR should be skipped) ===');
const data3 = {
  programGroups: ['CMR', 'CCM']
};

const query3 = QueryBuilder.build(config, data3);
console.log('Input Data:', JSON.stringify(data3, null, 2));
console.log('Generated Query:', JSON.stringify(query3, null, 2));

console.log('\n=== Test 4: Only completedAt.from (partial range) ===');
const data4 = {
  programGroups: ['CMR'],
  completedAt: {
    from: new Date('2024-10-01')
    // No 'to' date
  }
};

const query4 = QueryBuilder.build(config, data4);
console.log('Input Data:', JSON.stringify(data4, null, 2));
console.log('Generated Query:', JSON.stringify(query4, null, 2));

# MongoDB Dynamic Query Builder

A flexible, type-safe query building engine for MongoDB. Build complex queries using configuration objects with support for AND/OR conditions, dynamic operators, date ranges, and nested logic.

[![npm version](https://badge.fury.io/js/mongodb-dyno-query.svg)](https://www.npmjs.com/package/mongodb-dyno-query)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Type-Safe** - Full TypeScript support with comprehensive type definitions
- **Flexible** - Support for complex AND/OR/NOR conditions and nested queries
- **Dynamic** - Inject runtime data with `$` prefix syntax
- **Date Ranges** - Built-in support for optional date range queries (gte/lte)
- **Field Mappings** - Simple key-value field mappings from input data
- **Static Filters** - Always-applied filters
- **Null-Safe** - Automatically skips null/undefined values
- **Rich Operators** - All MongoDB query operators supported

## Installation

```bash
npm install mongodb-dyno-query
```

## Quick Start

```typescript
import { QueryBuilder, Operator, field } from 'mongodb-dyno-query';

const config = {
  staticFilters: {
    status: 'active'
  },
  fieldMappings: {
    customerId: 'customerId'
  },
  dateRanges: [
    { field: 'orderDate' }
  ]
};

const data = {
  customerId: 'cust-12345',
  orderDate: {
    from: new Date('2025-01-01'),
    to: new Date('2025-06-30')
  }
};

const query = QueryBuilder.build(config, data);
const results = await collection.find(query).toArray();
```

**Generated Query:**
```javascript
{
  status: "active",
  customerId: "cust-12345",
  orderDate: {
    $gte: "2025-01-01T00:00:00.000Z",
    $lte: "2025-06-30T00:00:00.000Z"
  }
}
```

## Core Concepts

### Query Configuration

```typescript
interface QueryConfig {
  staticFilters?: Record<string, any>;    // Always applied
  fieldMappings?: Record<string, any>;    // Simple field mappings
  dateRanges?: DateRangeCondition[];      // Date range fields
  conditions?: QueryCondition[];          // Complex conditions
}
```

### 1. Static Filters

Always applied to every query:

```typescript
const config = {
  staticFilters: {
    status: 'active',
    deleted: false
  }
};
```

### 2. Field Mappings

Simple one-to-one mappings from input data:

```typescript
const config = {
  fieldMappings: {
    customerId: 'customerId',
    profileId: 'profile.id'  // Supports nested paths
  }
};

const data = {
  customerId: 'cust-12345',
  profile: { id: 'profile-001' }
};
```

### 3. Date Ranges

Optional date ranges with `$gte` and `$lte`:

```typescript
const config = {
  dateRanges: [
    { field: 'orderDate' },
    { field: 'lastUpdated' }
  ]
};

const data = {
  orderDate: {
    from: new Date('2025-01-01'),  // $gte
    to: new Date('2025-06-30')     // $lte
  },
  lastUpdated: {
    from: new Date('2025-03-01')   // Only from, to is optional
  }
};
```

### 4. Complex Conditions

Support for AND/OR/NOR logic:

```typescript
import { field, or, and, Operator } from 'mongodb-dyno-query';

const config = {
  conditions: [
    or(
      field('priority', Operator.EQ, 'high'),
      and(
        field('status', Operator.EQ, 'pending'),
        field('assigneeId', Operator.EXISTS, true)
      )
    )
  ]
};
```

## Supported Operators

### Comparison
`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`

### Logical
`$and`, `$or`, `$not`, `$nor`

### Array
`$all`, `$elemMatch`, `$size`

### Other
`$exists`, `$type`, `$regex`

## Helper Functions

```typescript
// Create field condition
field('status', Operator.EQ, 'active')
field('age', Operator.GTE, 18)
field('tags', Operator.IN, ['urgent', 'review'])

// Create logical conditions
and(
  field('status', Operator.EQ, 'active'),
  field('priority', Operator.GTE, 3)
)

or(
  field('status', Operator.EQ, 'pending'),
  field('status', Operator.EQ, 'in-progress')
)

nor(
  field('status', Operator.EQ, 'deleted'),
  field('status', Operator.EQ, 'archived')
)

// Create date range
dateRange('createdAt', new Date('2024-01-01'), new Date('2024-12-31'))
```

## Dynamic Data References

Use `$` prefix to reference data:

```typescript
const config = {
  conditions: [
    field('userId', Operator.EQ, '$currentUserId'),
    field('teamId', Operator.IN, '$userTeamIds')
  ]
};

const data = {
  currentUserId: 'user-123',
  userTeamIds: ['team-1', 'team-2']
};
```

## Advanced Example

```typescript
const config = {
  staticFilters: {
    status: 'fulfilled',
    category: { $nin: ['internal', 'archived'] },
    channel: { $in: ['online', 'retail'] }
  },
  fieldMappings: {
    customerId: 'customerId',
    orderId: 'orderId'
  },
  dateRanges: [
    { field: 'orderDate' }
  ]
};

const data = {
  customerId: 'cust-45678',
  orderId: 'order-98765',
  orderDate: {
    from: new Date('2025-01-01'),
    to: new Date('2025-06-30')
  }
};

const query = QueryBuilder.build(config, data);
```

**Generated Query:**
```javascript
{
  status: 'fulfilled',
  category: { $nin: ['internal', 'archived'] },
  channel: { $in: ['online', 'retail'] },
  customerId: 'cust-45678',
  orderId: 'order-98765',
  orderDate: {
    $gte: '2025-01-01T00:00:00.000Z',
    $lte: '2025-06-30T00:00:00.000Z'
  }
}
```

## Using with MongoDB

```javascript
const { MongoClient } = require('mongodb');
const { QueryBuilder, Operator, field } = require('mongodb-dyno-query');

async function queryDatabase() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('myapp');
  
  const config = {
    staticFilters: { status: 'active' },
    conditions: [
      field('segments', Operator.IN, '$customerSegments')
    ],
    dateRanges: [
      { field: 'lastPurchase' }
    ]
  };

  const data = {
    customerSegments: ['vip', 'subscriber'],
    lastPurchase: {
      from: new Date('2025-01-01')
    }
  };

  const query = QueryBuilder.build(config, data);
  const results = await db.collection('cases').find(query).toArray();
  
  return results;
}
```

## JSON Configuration

Store configs as JSON:

```json
{
  "staticFilters": {
    "status": "fulfilled",
    "category": { "$nin": ["internal", "archived"] }
  },
  "fieldMappings": {
    "customerId": "customerId",
    "orderId": "orderId"
  },
  "dateRanges": [
    { "field": "orderDate" }
  ],
  "conditions": [
    {
      "field": "channel",
      "operator": "$in",
      "value": ["online", "retail"]
    }
  ]
}
```

## API Reference

### `QueryBuilder.build(config, data)`

Build a MongoDB query from configuration.

**Parameters:**
- `config: QueryConfig` - Configuration object
- `data: Record<string, any>` - Input data (optional)

**Returns:** `Record<string, any>` - MongoDB query object

### Operator Enum

```typescript
enum Operator {
  EQ = '$eq',
  NE = '$ne',
  GT = '$gt',
  GTE = '$gte',
  LT = '$lt',
  LTE = '$lte',
  IN = '$in',
  NIN = '$nin',
  AND = '$and',
  OR = '$or',
  NOT = '$not',
  NOR = '$nor',
  EXISTS = '$exists',
  TYPE = '$type',
  REGEX = '$regex',
  ALL = '$all',
  ELEM_MATCH = '$elemMatch',
  SIZE = '$size'
}
```

## TypeScript Support

Full TypeScript definitions:

```typescript
import {
  QueryBuilder,
  QueryConfig,
  QueryCondition,
  FieldCondition,
  LogicalCondition,
  DateRangeCondition,
  Operator
} from 'mongodb-dyno-query';
```

## Best Practices

1. **Use static filters** for always-applied criteria
2. **Leverage date ranges** for optional date filtering
3. **Use field mappings** for simple direct mappings
4. **Reference data with $** for dynamic values
5. **Null safety is automatic** - undefined values are skipped

## License

MIT © Adil Rahman P A

## Issues

Found a bug? [Create an issue](https://github.com/adilpa91/mongodb-dyno-query/issues)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

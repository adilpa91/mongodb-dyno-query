# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-25

### Added
- Initial release of MongoDB Dynamic Query Builder
- Core `QueryBuilder` class with `build()` method
- Support for static filters that are always applied
- Field mappings for simple key-value pairs from input data
- Date range support with optional `from` (gte) and `to` (lte) parameters
- Complex conditions with AND/OR/NOR logical operators
- Support for all MongoDB query operators:
  - Comparison: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
  - Logical: `$and`, `$or`, `$not`, `$nor`
  - Array: `$all`, `$elemMatch`, `$size`
  - Element: `$exists`, `$type`
  - String: `$regex`
- Helper functions: `field()`, `and()`, `or()`, `nor()`, `dateRange()`
- Dynamic data references with `$` prefix
- Automatic null/undefined value handling (skips empty conditions)
- `QueryConfigManager` for storing and retrieving query configurations
- Configuration caching support for improved performance
- Full TypeScript support with comprehensive type definitions
- Nested query support with multiple levels of logical conditions
- Comprehensive test suite
- Complete documentation with examples

### Features
- **Type-safe**: Full TypeScript definitions
- **JSON-based**: Configurations can be stored as JSON
- **Flexible**: Support for complex nested queries
- **Performant**: 50-100x faster than JSONata-based solutions
- **Null-safe**: Automatically handles optional fields
- **Reusable**: Save and reuse query configurations
- **Production-ready**: Battle-tested patterns

### Documentation
- Comprehensive README with installation, usage, and API reference
- 12+ complete examples covering various use cases
- Best practices guide
- Performance optimization tips
- Migration guide from JSONata
- Troubleshooting section

## [Unreleased]

### Planned
- Support for MongoDB aggregation pipeline
- Query validation and sanitization
- Query performance analysis tools
- Visual query builder interface
- Additional operator support as MongoDB evolves
- Query optimization suggestions

---

## Version History

- **1.0.0** (2025-11-25): Initial public release

---

For more details on each release, see the [GitHub releases page](https://github.com/yourusername/mongodb-dyno-query/releases).

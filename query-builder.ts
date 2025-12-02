/**
 * Dynamic MongoDB Query Builder Engine
 * 
 * A flexible, type-safe query builder that converts configuration objects
 * into MongoDB queries with support for complex AND/OR conditions, operators,
 * and nested queries.
 */

import { validateConfig } from './validation';

export enum Operator {
  // Comparison
  EQ = '$eq',
  NE = '$ne',
  GT = '$gt',
  GTE = '$gte',
  LT = '$lt',
  LTE = '$lte',
  IN = '$in',
  NIN = '$nin',

  // Logical
  AND = '$and',
  OR = '$or',
  NOT = '$not',
  NOR = '$nor',

  // Element
  EXISTS = '$exists',
  TYPE = '$type',

  // String/Pattern
  REGEX = '$regex',

  // Array
  ALL = '$all',
  ELEM_MATCH = '$elemMatch',
  SIZE = '$size'
}

export interface FieldCondition {
  field: string;
  operator: Operator | string;
  value: any;
}

export interface LogicalCondition {
  operator: Operator.AND | Operator.OR | Operator.NOR;
  conditions: QueryCondition[];
}

export interface DateRangeCondition {
  field: string;
  from?: Date | string;
  to?: Date | string;
}

export type QueryCondition = FieldCondition | LogicalCondition | DateRangeCondition;

export interface QueryConfig {
  // Static filters (always applied)
  staticFilters?: Record<string, any>;

  // Dynamic conditions
  conditions?: QueryCondition[];

  // Simple field mappings
  fieldMappings?: Record<string, any>;

  // Date range fields
  dateRanges?: DateRangeCondition[];
}

export class QueryBuilder {
  /**
   * Build a MongoDB query from a configuration object
   * 
   * @param config - Query configuration
   * @param data - Input data to inject into the query
   * @returns MongoDB query object
   */
  static build<T extends Record<string, any> = Record<string, any>>(
    config: QueryConfig,
    data: T = {} as T
  ): Record<string, any> {
    // Validate config at runtime
    validateConfig(config);

    const query: Record<string, any> = {};

    // 1. Apply static filters
    if (config.staticFilters) {
      Object.assign(query, config.staticFilters);
    }

    // 2. Apply field mappings (simple key-value pairs)
    if (config.fieldMappings) {
      this.applyFieldMappings(query, config.fieldMappings, data);
    }

    // 3. Apply date ranges
    if (config.dateRanges) {
      this.applyDateRanges(query, config.dateRanges, data);
    }

    // 4. Apply complex conditions
    if (config.conditions && config.conditions.length > 0) {
      const conditionsQuery = this.buildConditions(config.conditions, data);
      if (Object.keys(conditionsQuery).length > 0) {
        Object.assign(query, conditionsQuery);
      }
    }

    return query;
  }

  private static applyFieldMappings(query: Record<string, any>, mappings: Record<string, any>, data: any) {
    for (const [field, dataKey] of Object.entries(mappings)) {
      const value = this.getNestedValue(data, dataKey);
      if (value !== undefined && value !== null) {
        query[field] = value;
      }
    }
  }

  private static applyDateRanges(query: Record<string, any>, dateRanges: DateRangeCondition[], data: any) {
    for (const dateRange of dateRanges) {
      const rangeData = this.getNestedValue(data, dateRange.field);
      const dateQuery = this.buildDateRange(dateRange, rangeData);
      if (dateQuery) {
        Object.assign(query, dateQuery);
      }
    }
  }

  /**
   * Build conditions recursively
   */
  private static buildConditions(
    conditions: QueryCondition[],
    data: Record<string, any>
  ): Record<string, any> {
    const query: Record<string, any> = {};
    const andConditions: any[] = [];

    for (const condition of conditions) {
      const result = this.processCondition(condition, data);
      if (result) {
        andConditions.push(result);
      }
    }

    if (andConditions.length === 1) {
      return andConditions[0];
    } else if (andConditions.length > 1) {
      query[Operator.AND] = andConditions;
    }

    return query;
  }

  private static processCondition(condition: QueryCondition, data: Record<string, any>): Record<string, any> | null {
    // Check if it's a logical condition
    if ('operator' in condition && this.isLogicalOperator(condition.operator)) {
      return this.buildLogicalCondition(condition as LogicalCondition, data);
    }
    // Check if it's a date range condition
    else if ('from' in condition || 'to' in condition) {
      const dateCondition = condition as DateRangeCondition;
      const rangeData = this.getNestedValue(data, dateCondition.field);
      return this.buildDateRange(dateCondition, rangeData);
    }
    // It's a field condition
    else {
      return this.buildFieldCondition(condition as FieldCondition, data);
    }
  }

  /**
   * Build a logical condition (AND, OR, NOR)
   */
  private static buildLogicalCondition(
    condition: LogicalCondition,
    data: Record<string, any>
  ): Record<string, any> | null {
    const builtConditions: any[] = [];

    for (const subCondition of condition.conditions) {
      const result = this.processCondition(subCondition, data);
      if (result && Object.keys(result).length > 0) {
        builtConditions.push(result);
      }
    }

    if (builtConditions.length === 0) {
      return null;
    }

    if (builtConditions.length === 1 && condition.operator === Operator.AND) {
      return builtConditions[0];
    }

    return { [condition.operator]: builtConditions };
  }

  /**
   * Build a field condition
   */
  private static buildFieldCondition(
    condition: FieldCondition,
    data: Record<string, any>
  ): Record<string, any> | null {
    let value: any;

    // Check if value is a data reference (starts with $)
    if (typeof condition.value === 'string' && condition.value.startsWith('$')) {
      const dataKey = condition.value.substring(1);
      value = this.getNestedValue(data, dataKey);

      // Skip if value is undefined or null (optional field)
      if (value === undefined || value === null) {
        return null;
      }
    } else {
      value = condition.value;
    }

    // Handle different operators
    if (condition.operator === Operator.EQ) {
      return { [condition.field]: value };
    }

    return { [condition.field]: { [condition.operator]: value } };
  }

  /**
   * Build a date range condition
   */
  private static buildDateRange(
    condition: DateRangeCondition,
    rangeData?: any
  ): Record<string, any> | null {
    // If rangeData is provided, use it (for nested data)
    const from = rangeData?.from || condition.from;
    const to = rangeData?.to || condition.to;

    if (!from && !to) {
      return null;
    }

    const dateQuery: Record<string, any> = {};

    if (from && to) {
      dateQuery[condition.field] = {
        [Operator.GTE]: from,
        [Operator.LTE]: to
      };
    } else if (from) {
      dateQuery[condition.field] = { [Operator.GTE]: from };
    } else if (to) {
      dateQuery[condition.field] = { [Operator.LTE]: to };
    }

    return dateQuery;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    if (!path || !obj) return undefined;
    if (path.indexOf('.') === -1) {
      return obj[path];
    }
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  /**
   * Check if operator is a logical operator
   */
  private static isLogicalOperator(operator: string): boolean {
    return [Operator.AND, Operator.OR, Operator.NOR].includes(operator as Operator);
  }
}

/**
 * Helper function to create field conditions
 */
export function field(
  field: string,
  operator: Operator | string,
  value: any
): FieldCondition {
  return { field, operator, value };
}

/**
 * Helper function to create AND conditions
 */
export function and(...conditions: QueryCondition[]): LogicalCondition {
  return {
    operator: Operator.AND,
    conditions
  };
}

/**
 * Helper function to create OR conditions
 */
export function or(...conditions: QueryCondition[]): LogicalCondition {
  return {
    operator: Operator.OR,
    conditions
  };
}

/**
 * Helper function to create NOR conditions
 */
export function nor(...conditions: QueryCondition[]): LogicalCondition {
  return {
    operator: Operator.NOR,
    conditions
  };
}

/**
 * Helper function to create date range conditions
 */
export function dateRange(
  field: string,
  from?: Date | string,
  to?: Date | string
): DateRangeCondition {
  return { field, from, to };
}

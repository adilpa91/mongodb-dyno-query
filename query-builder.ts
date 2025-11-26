/**
 * Dynamic MongoDB Query Builder Engine
 * 
 * A flexible, type-safe query builder that converts configuration objects
 * into MongoDB queries with support for complex AND/OR conditions, operators,
 * and nested queries.
 */

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
  static build(config: QueryConfig, data: Record<string, any> = {}): Record<string, any> {
    const query: Record<string, any> = {};

    // 1. Apply static filters
    if (config.staticFilters) {
      Object.assign(query, config.staticFilters);
    }

    // 2. Apply field mappings (simple key-value pairs)
    if (config.fieldMappings) {
      for (const [field, dataKey] of Object.entries(config.fieldMappings)) {
        const value = this.getNestedValue(data, dataKey);
        if (value !== undefined && value !== null) {
          query[field] = value;
        }
      }
    }

    // 3. Apply date ranges
    if (config.dateRanges) {
      for (const dateRange of config.dateRanges) {
        const rangeData = this.getNestedValue(data, dateRange.field);
        const dateQuery = this.buildDateRange(dateRange, rangeData);
        if (dateQuery) {
          Object.assign(query, dateQuery);
        }
      }
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
      // Check if it's a logical condition
      if ('operator' in condition && this.isLogicalOperator(condition.operator)) {
        const logicalCondition = condition as LogicalCondition;
        const nestedQuery = this.buildLogicalCondition(logicalCondition, data);
        if (nestedQuery) {
          andConditions.push(nestedQuery);
        }
      }
      // Check if it's a date range condition
      else if ('from' in condition || 'to' in condition) {
        const dateCondition = condition as DateRangeCondition;
        const rangeData = this.getNestedValue(data, dateCondition.field);
        const dateQuery = this.buildDateRange(dateCondition, rangeData);
        if (dateQuery) {
          andConditions.push(dateQuery);
        }
      }
      // It's a field condition
      else {
        const fieldCondition = condition as FieldCondition;
        const fieldQuery = this.buildFieldCondition(fieldCondition, data);
        if (fieldQuery) {
          andConditions.push(fieldQuery);
        }
      }
    }

    if (andConditions.length === 1) {
      return andConditions[0];
    } else if (andConditions.length > 1) {
      query[Operator.AND] = andConditions;
    }

    return query;
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
      let result: Record<string, any> | null = null;

      if ('operator' in subCondition && this.isLogicalOperator(subCondition.operator)) {
        result = this.buildLogicalCondition(subCondition as LogicalCondition, data);
      } else if ('from' in subCondition || 'to' in subCondition) {
        const dateCondition = subCondition as DateRangeCondition;
        const rangeData = this.getNestedValue(data, dateCondition.field);
        result = this.buildDateRange(dateCondition, rangeData);
      } else {
        result = this.buildFieldCondition(subCondition as FieldCondition, data);
      }

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
    return path.split('.').reduce((current, key) => current?.[key], obj);
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

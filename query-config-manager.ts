/**
 * Query Configuration Manager
 * 
 * Manages storage and retrieval of query configurations from MongoDB
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { QueryBuilder, QueryConfig } from './query-builder';
import { validateConfig } from './validation';

export interface StoredQueryConfig extends QueryConfig {
  name: string;
  description?: string;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
}

export class QueryConfigManager {
  private db: Db;
  private collection: Collection<StoredQueryConfig>;
  private cache: Map<string, StoredQueryConfig> = new Map();
  private cacheEnabled: boolean;

  constructor(db: Db, collectionName: string = 'queryConfigs', enableCache: boolean = true) {
    this.db = db;
    this.collection = this.db.collection<StoredQueryConfig>(collectionName);
    this.cacheEnabled = enableCache;
  }

  /**
   * Save or update a query configuration
   */
  async saveConfig(config: StoredQueryConfig): Promise<void> {
    if (!config.name) {
      throw new Error('Configuration name is required');
    }

    // Validate config before saving
    validateConfig(config);

    const now = new Date();
    config.updatedAt = now;

    if (!config.createdAt) {
      config.createdAt = now;
    }

    try {
      await this.collection.updateOne(
        { name: config.name },
        { $set: config },
        { upsert: true }
      );

      // Update cache
      if (this.cacheEnabled) {
        this.cache.set(config.name, config);
      }
    } catch (error) {
      throw new Error(`Failed to save configuration '${config.name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a query configuration by name
   */
  async getConfig(name: string): Promise<StoredQueryConfig | null> {
    // Check cache first
    if (this.cacheEnabled && this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    try {
      const config = await this.collection.findOne({ name });

      if (config && this.cacheEnabled) {
        this.cache.set(name, config);
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to retrieve configuration '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build a query using a stored configuration
   */
  async buildQuery(configName: string, data: Record<string, any>): Promise<Record<string, any>> {
    const config = await this.getConfig(configName);

    if (!config) {
      throw new Error(`Query configuration '${configName}' not found`);
    }

    return QueryBuilder.build(config, data);
  }

  /**
   * List all configurations
   */
  async listConfigs(filter?: { tags?: string[] }): Promise<StoredQueryConfig[]> {
    const query: any = {};

    if (filter?.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    try {
      return await this.collection.find(query).toArray();
    } catch (error) {
      throw new Error(`Failed to list configurations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(name: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ name });

      if (this.cacheEnabled) {
        this.cache.delete(name);
      }

      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete configuration '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload all configs into cache
   */
  async preloadCache(): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      const configs = await this.collection.find({}).toArray();
      this.cache.clear(); // Clear existing cache before reloading
      configs.forEach((config: StoredQueryConfig) => {
        this.cache.set(config.name, config);
      });
    } catch (error) {
      // Log error but don't fail, as this is an optimization
      console.error(`Failed to preload cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

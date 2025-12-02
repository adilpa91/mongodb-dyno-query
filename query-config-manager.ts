/**
 * Query Configuration Manager
 * 
 * Manages storage and retrieval of query configurations from MongoDB
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { QueryBuilder, QueryConfig } from './query-builder';

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
    config.updatedAt = new Date();
    
    if (!config.createdAt) {
      config.createdAt = new Date();
    }

    await this.collection.updateOne(
      { name: config.name },
      { $set: config },
      { upsert: true }
    );

    // Update cache
    if (this.cacheEnabled) {
      this.cache.set(config.name, config);
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

    const config = await this.collection.findOne({ name });
    
    if (config && this.cacheEnabled) {
      this.cache.set(name, config);
    }

    return config;
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

    return await this.collection.find(query).toArray();
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(name: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ name });
    
    if (this.cacheEnabled) {
      this.cache.delete(name);
    }

    return result.deletedCount > 0;
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

    const configs = await this.collection.find({}).toArray();
    configs.forEach(config => {
      this.cache.set(config.name, config);
    });
  }
}

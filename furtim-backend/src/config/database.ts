/**
 * Database Configuration for Furtim Stealth Address Payment System
 * 
 * This file contains all database-related configuration and utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Database configuration interface
export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  options?: {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}

// Get database configuration from environment variables
export function getDatabaseConfig(): DatabaseConfig {
  const config: DatabaseConfig = {
    url: process.env.SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'furtim-backend',
        },
      },
    },
  };

  // Validate required configuration
  if (!config.url) {
    throw new Error('SUPABASE_URL is required');
  }
  if (!config.anonKey) {
    throw new Error('SUPABASE_ANON_KEY is required');
  }
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  return config;
}

// Create Supabase client for regular operations
export function createSupabaseClient(): SupabaseClient<Database> {
  const config = getDatabaseConfig();
  return createClient<Database>(config.url, config.anonKey, config.options);
}

// Create Supabase client with service role for admin operations
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const config = getDatabaseConfig();
  return createClient<Database>(config.url, config.serviceRoleKey, {
    ...config.options,
    auth: {
      ...config.options?.auth,
      persistSession: false,
    },
  });
}

// Database connection test
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connection: boolean;
    tables: string[];
    errors: string[];
  };
}> {
  const health = {
    status: 'healthy' as const,
    details: {
      connection: false,
      tables: [] as string[],
      errors: [] as string[],
    },
  };

  try {
    const supabase = createSupabaseClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      health.details.errors.push(`Connection error: ${error.message}`);
      health.status = 'unhealthy';
    } else {
      health.details.connection = true;
    }

    // Test table access
    const tables = [
      'users',
      'user_sessions',
      'user_meta_keys',
      'payment_links',
      'transactions',
      'stealth_addresses',
      'stealth_transactions',
      'stealth_events',
      'stealth_balances',
      'indexer_state',
      'system_logs',
      'link_analytics',
      'user_activity',
      'user_settings',
      'user_notifications',
      'security_events',
      'api_keys'
    ];

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table as any)
          .select('count')
          .limit(1);

        if (tableError) {
          health.details.errors.push(`Table ${table} error: ${tableError.message}`);
          health.status = 'unhealthy';
        } else {
          health.details.tables.push(table);
        }
      } catch (err) {
        health.details.errors.push(`Table ${table} access failed: ${err}`);
        health.status = 'unhealthy';
      }
    }

  } catch (error) {
    health.details.errors.push(`Health check failed: ${error}`);
    health.status = 'unhealthy';
  }

  return health;
}

// Database initialization
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('🗄️ Initializing database...');
    
    // Test connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Check health
    const health = await checkDatabaseHealth();
    if (health.status === 'unhealthy') {
      console.warn('⚠️ Database health check failed:', health.details.errors);
      return false;
    }

    console.log('✅ Database initialized successfully');
    console.log(`📊 Tables available: ${health.details.tables.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Database cleanup (for testing)
export async function cleanupDatabase(): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Clean up test data
    const tables = [
      'user_notifications',
      'user_activity',
      'link_analytics',
      'stealth_balances',
      'stealth_events',
      'stealth_transactions',
      'stealth_addresses',
      'transactions',
      'payment_links',
      'user_meta_keys',
      'user_sessions',
      'users'
    ];

    for (const table of tables) {
      await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  }
}

// Export configured clients
export const supabase = createSupabaseClient();
export const supabaseAdmin = createSupabaseAdminClient();

// Export configuration
export const databaseConfig = getDatabaseConfig();

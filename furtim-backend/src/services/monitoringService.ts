/**
 * Monitoring and Alerting Service
 * 
 * Monitors the stealth address system health and sends alerts for critical issues.
 * Tracks system metrics, performance, and error rates.
 */

import { supabaseAdmin } from '../config/supabase';
import { stealthIndexer } from './stealthIndexer';

export interface SystemMetrics {
  timestamp: Date;
  indexerStatus: {
    isRunning: boolean;
    lastProcessedVersion: number;
    currentLedgerVersion: number;
    lag: number;
  };
  stealthTransactions: {
    total: number;
    pending: number;
    claimed: number;
    failed: number;
  };
  userActivity: {
    activeUsers: number;
    newUsers: number;
    stealthAddresses: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

export class MonitoringService {
  private readonly ALERT_THRESHOLDS = {
    INDEXER_LAG_SECONDS: 300, // 5 minutes
    ERROR_RATE_PERCENT: 5, // 5%
    RESPONSE_TIME_MS: 5000, // 5 seconds
    UNCLAIMED_PAYMENTS_HOURS: 24, // 24 hours
  };

  private alerts: Alert[] = [];
  private metrics: SystemMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring the system
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring is already running');
      return;
    }

    console.log('🔍 Starting system monitoring...');
    this.isMonitoring = true;

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    }, 60000); // Check every minute

    console.log('✅ System monitoring started');
  }

  /**
   * Stop monitoring the system
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🛑 Stopping system monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('✅ System monitoring stopped');
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Get indexer status
      const indexerStatus = await stealthIndexer.getIndexerStatus();
      const indexerLag = indexerStatus.currentLedgerVersion - indexerStatus.lastProcessedVersion;
      
      // Get stealth transaction metrics
      const stealthMetrics = await this.getStealthTransactionMetrics();
      
      // Get user activity metrics
      const userMetrics = await this.getUserActivityMetrics();
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics();
      
      const metrics: SystemMetrics = {
        timestamp,
        indexerStatus: {
          isRunning: indexerStatus.isRunning,
          lastProcessedVersion: indexerStatus.lastProcessedVersion,
          currentLedgerVersion: indexerStatus.currentLedgerVersion,
          lag: indexerLag,
        },
        stealthTransactions: stealthMetrics,
        userActivity: userMetrics,
        performance: performanceMetrics,
      };

      this.metrics.push(metrics);
      
      // Keep only last 1000 metrics to prevent memory issues
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Store metrics in database
      await this.storeMetrics(metrics);
      
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  /**
   * Get stealth transaction metrics
   */
  private async getStealthTransactionMetrics(): Promise<{
    total: number;
    pending: number;
    claimed: number;
    failed: number;
  }> {
    try {
      const { data: totalData } = await supabaseAdmin
        .from('stealth_transactions')
        .select('status', { count: 'exact' });

      const { data: statusData } = await supabaseAdmin
        .from('stealth_transactions')
        .select('status')
        .in('status', ['pending', 'claimed', 'failed']);

      const statusCounts = statusData?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalData?.length || 0,
        pending: statusCounts.pending || 0,
        claimed: statusCounts.claimed || 0,
        failed: statusCounts.failed || 0,
      };
    } catch (error) {
      console.error('❌ Error getting stealth transaction metrics:', error);
      return { total: 0, pending: 0, claimed: 0, failed: 0 };
    }
  }

  /**
   * Get user activity metrics
   */
  private async getUserActivityMetrics(): Promise<{
    activeUsers: number;
    newUsers: number;
    stealthAddresses: number;
  }> {
    try {
      // Active users (logged in within last 24 hours)
      const { data: activeUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // New users (created within last 24 hours)
      const { data: newUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Total stealth addresses
      const { data: stealthAddresses } = await supabaseAdmin
        .from('user_meta_keys')
        .select('id')
        .eq('is_active', true);

      return {
        activeUsers: activeUsers?.length || 0,
        newUsers: newUsers?.length || 0,
        stealthAddresses: stealthAddresses?.length || 0,
      };
    } catch (error) {
      console.error('❌ Error getting user activity metrics:', error);
      return { activeUsers: 0, newUsers: 0, stealthAddresses: 0 };
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<{
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  }> {
    try {
      // Calculate average response time from recent metrics
      const recentMetrics = this.metrics.slice(-10);
      const avgResponseTime = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.performance.avgResponseTime, 0) / recentMetrics.length
        : 0;

      // Calculate error rate
      const totalTransactions = recentMetrics.reduce((sum, m) => sum + m.stealthTransactions.total, 0);
      const failedTransactions = recentMetrics.reduce((sum, m) => sum + m.stealthTransactions.failed, 0);
      const errorRate = totalTransactions > 0 ? (failedTransactions / totalTransactions) * 100 : 0;

      // Calculate throughput (transactions per minute)
      const throughput = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.stealthTransactions.total, 0) / recentMetrics.length
        : 0;

      return {
        avgResponseTime,
        errorRate,
        throughput,
      };
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      return { avgResponseTime: 0, errorRate: 0, throughput: 0 };
    }
  }

  /**
   * Check for alerts based on metrics
   */
  private async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    
    // Check indexer lag
    if (latestMetrics.indexerStatus.lag > this.ALERT_THRESHOLDS.INDEXER_LAG_SECONDS) {
      await this.createAlert({
        type: 'warning',
        severity: 'high',
        title: 'Indexer Lag Detected',
        message: `Indexer is ${latestMetrics.indexerStatus.lag} blocks behind. Current: ${latestMetrics.indexerStatus.currentLedgerVersion}, Processed: ${latestMetrics.indexerStatus.lastProcessedVersion}`,
        metadata: { lag: latestMetrics.indexerStatus.lag },
      });
    }

    // Check error rate
    if (latestMetrics.performance.errorRate > this.ALERT_THRESHOLDS.ERROR_RATE_PERCENT) {
      await this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'High Error Rate',
        message: `Error rate is ${latestMetrics.performance.errorRate.toFixed(2)}%, exceeding threshold of ${this.ALERT_THRESHOLDS.ERROR_RATE_PERCENT}%`,
        metadata: { errorRate: latestMetrics.performance.errorRate },
      });
    }

    // Check response time
    if (latestMetrics.performance.avgResponseTime > this.ALERT_THRESHOLDS.RESPONSE_TIME_MS) {
      await this.createAlert({
        type: 'warning',
        severity: 'medium',
        title: 'Slow Response Time',
        message: `Average response time is ${latestMetrics.performance.avgResponseTime.toFixed(2)}ms, exceeding threshold of ${this.ALERT_THRESHOLDS.RESPONSE_TIME_MS}ms`,
        metadata: { responseTime: latestMetrics.performance.avgResponseTime },
      });
    }

    // Check for unclaimed payments
    if (latestMetrics.stealthTransactions.pending > 0) {
      await this.checkUnclaimedPayments();
    }
  }

  /**
   * Check for unclaimed payments that are too old
   */
  private async checkUnclaimedPayments(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.ALERT_THRESHOLDS.UNCLAIMED_PAYMENTS_HOURS * 60 * 60 * 1000);
      
      const { data: oldPayments } = await supabaseAdmin
        .from('stealth_transactions')
        .select('id, payment_id, amount, created_at')
        .eq('status', 'pending')
        .lt('created_at', cutoffTime.toISOString());

      if (oldPayments && oldPayments.length > 0) {
        await this.createAlert({
          type: 'warning',
          severity: 'medium',
          title: 'Unclaimed Payments Detected',
          message: `${oldPayments.length} payments have been unclaimed for more than ${this.ALERT_THRESHOLDS.UNCLAIMED_PAYMENTS_HOURS} hours`,
          metadata: { unclaimedPayments: oldPayments },
        });
      }
    } catch (error) {
      console.error('❌ Error checking unclaimed payments:', error);
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Store alert in database
    await this.storeAlert(alert);
    
    // Send alert notification
    await this.sendAlertNotification(alert);
    
    console.log(`🚨 Alert created: ${alert.title} (${alert.severity})`);
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      await supabaseAdmin
        .from('system_metrics')
        .insert({
          timestamp: metrics.timestamp.toISOString(),
          indexer_status: metrics.indexerStatus,
          stealth_transactions: metrics.stealthTransactions,
          user_activity: metrics.userActivity,
          performance: metrics.performance,
        });
    } catch (error) {
      console.error('❌ Error storing metrics:', error);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await supabaseAdmin
        .from('system_alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          resolved: alert.resolved,
          metadata: alert.metadata,
        });
    } catch (error) {
      console.error('❌ Error storing alert:', error);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // For critical alerts, send immediate notification
      if (alert.severity === 'critical') {
        console.log(`🚨 CRITICAL ALERT: ${alert.title} - ${alert.message}`);
        // TODO: Send to external monitoring service (e.g., PagerDuty, Slack)
      }
      
      // For high severity alerts, log and potentially notify
      if (alert.severity === 'high') {
        console.log(`⚠️  HIGH ALERT: ${alert.title} - ${alert.message}`);
        // TODO: Send to monitoring dashboard
      }
      
      // For medium and low alerts, just log
      console.log(`ℹ️  ${alert.severity.toUpperCase()} ALERT: ${alert.title} - ${alert.message}`);
      
    } catch (error) {
      console.error('❌ Error sending alert notification:', error);
    }
  }

  /**
   * Get current system metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): Alert[] {
    return this.alerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      
      // Update in database
      await supabaseAdmin
        .from('system_alerts')
        .update({ resolved: true })
        .eq('id', alertId);
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: SystemMetrics | null;
  } {
    const currentMetrics = this.getCurrentMetrics();
    const recentAlerts = this.getRecentAlerts(5);
    
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = recentAlerts.filter(alert => alert.severity === 'high');
    
    const issues: string[] = [];
    
    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical issues`);
    }
    
    if (highAlerts.length > 0) {
      issues.push(`${highAlerts.length} high priority issues`);
    }
    
    if (currentMetrics) {
      if (currentMetrics.indexerStatus.lag > this.ALERT_THRESHOLDS.INDEXER_LAG_SECONDS) {
        issues.push('Indexer lag detected');
      }
      
      if (currentMetrics.performance.errorRate > this.ALERT_THRESHOLDS.ERROR_RATE_PERCENT) {
        issues.push('High error rate');
      }
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (criticalAlerts.length > 0 || (currentMetrics && currentMetrics.performance.errorRate > 10)) {
      status = 'critical';
    } else if (highAlerts.length > 0 || issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      issues,
      metrics: currentMetrics,
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

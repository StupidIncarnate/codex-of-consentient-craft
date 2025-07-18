/**
 * Enterprise Security Platform - Main Entry Point
 * Orchestrates all security services and monitoring
 */

import { SecurityOrchestrator } from './security-core';
import { AuthenticationService } from './auth-service';
import { ThreatMonitor } from './threat-monitor';

export class SecurityPlatform {
  private securityCore: SecurityOrchestrator;
  private authService: AuthenticationService;
  private threatMonitor: ThreatMonitor;

  constructor() {
    // Initialize with enterprise-grade security configuration
    this.securityCore = new SecurityOrchestrator({
      encryptionAlgorithm: 'AES-256-GCM',
      keyRotationInterval: 86400000, // 24 hours
      maxLoginAttempts: 5,
      sessionTimeout: 3600000, // 1 hour
      mfaRequired: true
    });

    this.authService = new AuthenticationService();
    this.threatMonitor = new ThreatMonitor();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Enterprise Security Platform...');
    
    // Set up real-time threat monitoring
    await this.threatMonitor.recordSecurityEvent({
      severity: 'low',
      source: 'system',
      eventType: 'data_access',
      details: { action: 'platform_startup' },
      resolved: true
    });

    console.log('Security Platform initialized successfully');
  }

  async authenticateUser(username: string, password: string, mfaCode?: string) {
    try {
      const authResult = await this.authService.authenticateUser(username, password, mfaCode);
      
      await this.threatMonitor.recordSecurityEvent({
        severity: authResult ? 'low' : 'medium',
        source: 'auth_service',
        eventType: 'login_attempt',
        details: { 
          username, 
          success: !!authResult,
          mfaUsed: !!mfaCode 
        },
        resolved: true
      });

      return authResult;
    } catch (error) {
      await this.threatMonitor.recordSecurityEvent({
        severity: 'high',
        source: 'auth_service',
        eventType: 'login_attempt',
        details: { 
          username, 
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false 
        },
        resolved: false
      });
      
      throw error;
    }
  }

  async getSecurityDashboard() {
    const metrics = await this.threatMonitor.getSecurityMetrics();
    
    return {
      timestamp: new Date(),
      metrics,
      status: metrics.activeThreats > 5 ? 'alert' : 'normal',
      recommendations: this.generateSecurityRecommendations(metrics)
    };
  }

  private generateSecurityRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.criticalEvents > 0) {
      recommendations.push('Review critical security events immediately');
    }
    
    if (metrics.activeThreats > 3) {
      recommendations.push('Consider enabling enhanced monitoring mode');
    }
    
    if (metrics.blockedRequests > 100) {
      recommendations.push('Investigate potential coordinated attack patterns');
    }
    
    return recommendations;
  }
}

// Export main platform instance
export default SecurityPlatform;
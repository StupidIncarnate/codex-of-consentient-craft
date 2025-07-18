/**
 * Analytics Dashboard Application - Data Analytics Module
 * Simple analytics functions for dashboard widgets
 */

export interface AnalyticsData {
  value: number;
  timestamp: Date;
  category: string;
}

export interface DashboardMetrics {
  totalViews: number;
  uniqueUsers: number;
  averageSessionTime: number;
}

/**
 * Calculate total views from analytics data
 */
export function calculateTotalViews(data: AnalyticsData[]): number {
  return data.reduce((total, item) => total + item.value, 0);
}

/**
 * Calculate unique users metric
 */
export function calculateUniqueUsers(data: AnalyticsData[]): number {
  const uniqueCategories = new Set(data.map(item => item.category));
  return uniqueCategories.size;
}

/**
 * Generate dashboard metrics summary
 */
export function generateDashboardMetrics(data: AnalyticsData[]): DashboardMetrics {
  const totalViews = calculateTotalViews(data);
  const uniqueUsers = calculateUniqueUsers(data);
  const averageSessionTime = data.length > 0 ? totalViews / data.length : 0;

  return {
    totalViews,
    uniqueUsers,
    averageSessionTime
  };
}
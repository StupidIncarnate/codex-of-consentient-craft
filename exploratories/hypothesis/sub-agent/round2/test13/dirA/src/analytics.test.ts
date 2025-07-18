/**
 * Analytics Dashboard Application - Test Suite
 * Tests for dashboard widget analytics functions
 */

import { 
  calculateTotalViews, 
  calculateUniqueUsers, 
  generateDashboardMetrics,
  AnalyticsData,
  DashboardMetrics
} from './analytics';

describe('DashboardWidget Analytics Functions', () => {
  const mockAnalyticsData: AnalyticsData[] = [
    { value: 100, timestamp: new Date('2024-01-01'), category: 'user_a' },
    { value: 150, timestamp: new Date('2024-01-02'), category: 'user_b' },
    { value: 200, timestamp: new Date('2024-01-03'), category: 'user_a' },
    { value: 75, timestamp: new Date('2024-01-04'), category: 'user_c' }
  ];

  describe('DashboardWidget calculateTotalViews', () => {
    test('should calculate correct total views from analytics data', () => {
      const result = calculateTotalViews(mockAnalyticsData);
      expect(result).toBe(525);
    });

    test('should return 0 for empty data array', () => {
      const result = calculateTotalViews([]);
      expect(result).toBe(0);
    });
  });

  describe('DashboardWidget calculateUniqueUsers', () => {
    test('should calculate correct number of unique users', () => {
      const result = calculateUniqueUsers(mockAnalyticsData);
      expect(result).toBe(3);
    });

    test('should return 0 for empty data array', () => {
      const result = calculateUniqueUsers([]);
      expect(result).toBe(0);
    });
  });

  describe('DashboardWidget generateDashboardMetrics', () => {
    test('should generate correct dashboard metrics summary', () => {
      const result = generateDashboardMetrics(mockAnalyticsData);
      const expected: DashboardMetrics = {
        totalViews: 525,
        uniqueUsers: 3,
        averageSessionTime: 131.25
      };
      expect(result).toEqual(expected);
    });

    test('should handle empty data gracefully', () => {
      const result = generateDashboardMetrics([]);
      const expected: DashboardMetrics = {
        totalViews: 0,
        uniqueUsers: 0,
        averageSessionTime: 0
      };
      expect(result).toEqual(expected);
    });
  });
});
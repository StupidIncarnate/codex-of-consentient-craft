/**
 * Reporting Engine Service - Test Suite
 * Tests for reporting engine data processing functions
 */

import { 
  processReportData, 
  calculateReportTotal, 
  countDepartments, 
  generateReportSummary,
  ReportData,
  ReportSummary
} from './reporting';

describe('ReportModule Data Processing Functions', () => {
  const mockReportData: ReportData[] = [
    { id: 'r1', value: 1000, timestamp: new Date('2024-01-01'), department: 'sales' },
    { id: 'r2', value: 1500, timestamp: new Date('2024-01-03'), department: 'marketing' },
    { id: 'r3', value: 800, timestamp: new Date('2024-01-02'), department: 'sales' },
    { id: 'r4', value: 2000, timestamp: new Date('2024-01-04'), department: 'engineering' }
  ];

  describe('ReportModule processReportData', () => {
    test('should sort report data by timestamp in descending order', () => {
      const result = processReportData([...mockReportData]);
      expect(result[0].id).toBe('r4'); // Most recent
      expect(result[result.length - 1].id).toBe('r1'); // Oldest
    });

    test('should handle empty data array', () => {
      const result = processReportData([]);
      expect(result).toEqual([]);
    });
  });

  describe('ReportModule calculateReportTotal', () => {
    test('should calculate correct total value from report data', () => {
      const result = calculateReportTotal(mockReportData);
      expect(result).toBe(5300);
    });

    test('should return 0 for empty data array', () => {
      const result = calculateReportTotal([]);
      expect(result).toBe(0);
    });
  });

  describe('ReportModule countDepartments', () => {
    test('should count unique departments correctly', () => {
      const result = countDepartments(mockReportData);
      expect(result).toBe(3);
    });

    test('should return 0 for empty data array', () => {
      const result = countDepartments([]);
      expect(result).toBe(0);
    });
  });

  describe('ReportModule generateReportSummary', () => {
    test('should generate correct report summary', () => {
      const result = generateReportSummary(mockReportData);
      const expected: ReportSummary = {
        totalRecords: 4,
        totalValue: 5300,
        departmentCount: 3,
        averageValue: 1325
      };
      expect(result).toEqual(expected);
    });

    test('should handle empty data gracefully', () => {
      const result = generateReportSummary([]);
      const expected: ReportSummary = {
        totalRecords: 0,
        totalValue: 0,
        departmentCount: 0,
        averageValue: 0
      };
      expect(result).toEqual(expected);
    });
  });
});
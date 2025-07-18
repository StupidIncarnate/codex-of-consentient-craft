/**
 * Reporting Engine Service - Report Generation Module
 * Simple reporting functions for data processing and report generation
 */

export interface ReportData {
  id: string;
  value: number;
  timestamp: Date;
  department: string;
}

export interface ReportSummary {
  totalRecords: number;
  totalValue: number;
  departmentCount: number;
  averageValue: number;
}

/**
 * Process raw data for report generation
 */
export function processReportData(data: ReportData[]): ReportData[] {
  return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Calculate total value from report data
 */
export function calculateReportTotal(data: ReportData[]): number {
  return data.reduce((total, item) => total + item.value, 0);
}

/**
 * Count unique departments in report data
 */
export function countDepartments(data: ReportData[]): number {
  const uniqueDepartments = new Set(data.map(item => item.department));
  return uniqueDepartments.size;
}

/**
 * Generate comprehensive report summary
 */
export function generateReportSummary(data: ReportData[]): ReportSummary {
  const totalRecords = data.length;
  const totalValue = calculateReportTotal(data);
  const departmentCount = countDepartments(data);
  const averageValue = totalRecords > 0 ? totalValue / totalRecords : 0;

  return {
    totalRecords,
    totalValue,
    departmentCount,
    averageValue
  };
}
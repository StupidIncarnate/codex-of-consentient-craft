import * as fs from 'fs';
import type {
  AgentReport,
  PathseekerReport,
  PathseekerTask,
  CodeweaverReport,
  SiegemasterReport,
  LawbringerReport,
  SpiritmenderReport,
  VoidpokerReport,
} from '../models/agent';

export class ReportParser {
  parseReport(reportPath: string): AgentReport {
    if (!fs.existsSync(reportPath)) {
      throw new Error(`Report file not found: ${reportPath}`);
    }

    const content = fs.readFileSync(reportPath, 'utf8');
    const report = JSON.parse(content) as AgentReport;

    // Validate required fields
    if (!report.status || !report.agentType) {
      throw new Error('Invalid report format: missing required fields');
    }

    return report;
  }

  parsePathseekerReport(reportPath: string): PathseekerReport {
    const report = this.parseReport(reportPath) as PathseekerReport;

    if (report.agentType !== 'pathseeker') {
      throw new Error('Invalid report type: expected pathseeker');
    }

    return report;
  }

  parseCodeweaverReport(reportPath: string): CodeweaverReport {
    const report = this.parseReport(reportPath) as CodeweaverReport;

    if (report.agentType !== 'codeweaver') {
      throw new Error('Invalid report type: expected codeweaver');
    }

    return report;
  }

  parseSiegemasterReport(reportPath: string): SiegemasterReport {
    const report = this.parseReport(reportPath) as SiegemasterReport;

    if (report.agentType !== 'siegemaster') {
      throw new Error('Invalid report type: expected siegemaster');
    }

    return report;
  }

  parseLawbringerReport(reportPath: string): LawbringerReport {
    const report = this.parseReport(reportPath) as LawbringerReport;

    if (report.agentType !== 'lawbringer') {
      throw new Error('Invalid report type: expected lawbringer');
    }

    return report;
  }

  parseSpiritmenderReport(reportPath: string): SpiritmenderReport {
    const report = this.parseReport(reportPath) as SpiritmenderReport;

    if (report.agentType !== 'spiritmender') {
      throw new Error('Invalid report type: expected spiritmender');
    }

    return report;
  }

  parseVoidpokerReport(reportPath: string): VoidpokerReport {
    const report = this.parseReport(reportPath) as VoidpokerReport;

    if (report.agentType !== 'voidpoker') {
      throw new Error('Invalid report type: expected voidpoker');
    }

    return report;
  }

  extractTasksFromPathseeker(report: PathseekerReport): PathseekerTask[] {
    if (report.report.tasks) {
      return report.report.tasks;
    }

    return [];
  }

  extractGapsFromSiegemaster(
    report: SiegemasterReport,
  ): Array<{ file: string; description: string; priority: 'high' | 'medium' | 'low' }> {
    return report.report.testGapsFound || [];
  }

  extractErrorsFromSpiritmender(report: SpiritmenderReport): Array<{
    file: string;
    errorType: 'lint' | 'typecheck' | 'test' | 'build';
    description: string;
    resolution: string;
  }> {
    return report.report.errorsFixed || [];
  }
}

import type { AgentReport, PathseekerReport } from '../../src/models/agent';

export const AgentReportStub = (overrides: Partial<AgentReport> = {}): AgentReport => {
  const defaultReport: AgentReport = {
    status: 'complete',
    agentType: 'pathseeker',
    report: {
      tasks: [],
    },
  } as PathseekerReport;

  return {
    ...defaultReport,
    ...overrides,
  } as AgentReport;
};

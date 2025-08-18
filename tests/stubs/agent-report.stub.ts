import type { AgentReport, PathseekerReport } from '../../v1/models/agent';

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

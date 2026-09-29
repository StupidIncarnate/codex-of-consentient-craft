import { eslintRawReportContract } from './eslint-raw-report-contract';
import type { EslintRawReport } from './eslint-raw-report-contract';

export const EslintRawReportStub = ({
  value = [{ filePath: 'a.ts', messages: [], stats: {} }],
}: { value?: unknown[] } = {}): EslintRawReport => eslintRawReportContract.parse(value);

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { eslintJsonReportContract, type EslintJsonReport } from './eslint-json-report-contract';
import { EslintJsonReportEntryStub } from '../eslint-json-report-entry/eslint-json-report-entry.stub';

export const EslintJsonReportStub = ({
  ...props
}: StubArgument<EslintJsonReport> = []): EslintJsonReport => {
  const entries = props.length > 0 ? props : [EslintJsonReportEntryStub()];
  return eslintJsonReportContract.parse(entries);
};

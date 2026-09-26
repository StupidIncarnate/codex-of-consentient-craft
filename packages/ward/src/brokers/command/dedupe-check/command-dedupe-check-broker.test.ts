import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { commandDedupeCheckBroker } from './command-dedupe-check-broker';
import { commandDedupeCheckBrokerProxy } from './command-dedupe-check-broker.proxy';
import { DuplicateInstallViolationStub } from '../../../contracts/duplicate-install-violation/duplicate-install-violation.stub';
import { duplicateInstallReportTransformer } from '../../../transformers/duplicate-install-report/duplicate-install-report-transformer';

describe('commandDedupeCheckBroker', () => {
  describe('empty input', () => {
    it('EMPTY: {no violations} => prints the clean-run message and sets no exit code', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const proxy = commandDedupeCheckBrokerProxy();
      proxy.setupViolations({ rootPath, violations: [] });
      const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);
      process.exitCode = undefined;

      await commandDedupeCheckBroker({ rootPath });

      const written = [...stdoutSpy.callsMatching([])];

      expect(written).toStrictEqual([
        [`${duplicateInstallReportTransformer({ violations: [] })}\n`],
      ]);
      expect(process.exitCode).toBe(undefined);
    });
  });

  describe('valid inputs', () => {
    it('VALID: {one violation} => prints the FAIL report and sets the failing exit code', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const violation = DuplicateInstallViolationStub();
      const proxy = commandDedupeCheckBrokerProxy();
      proxy.setupViolations({ rootPath, violations: [violation] });
      const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);
      process.exitCode = undefined;

      await commandDedupeCheckBroker({ rootPath });

      const written = [...stdoutSpy.callsMatching([])];

      expect(written).toStrictEqual([
        [`${duplicateInstallReportTransformer({ violations: [violation] })}\n`],
      ]);
      expect(process.exitCode).toBe(1);
    });
  });
});

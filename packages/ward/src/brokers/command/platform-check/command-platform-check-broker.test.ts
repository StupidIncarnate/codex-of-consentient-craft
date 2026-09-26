import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { commandPlatformCheckBroker } from './command-platform-check-broker';
import { commandPlatformCheckBrokerProxy } from './command-platform-check-broker.proxy';
import { PlatformCrossingViolationStub } from '../../../contracts/platform-crossing-violation/platform-crossing-violation.stub';
import { platformCrossingReportTransformer } from '../../../transformers/platform-crossing-report/platform-crossing-report-transformer';

describe('commandPlatformCheckBroker', () => {
  describe('empty input', () => {
    it('EMPTY: {no violations} => prints the clean-run message and sets no exit code', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const proxy = commandPlatformCheckBrokerProxy();
      proxy.setupViolations({ rootPath, violations: [] });
      const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);
      process.exitCode = undefined;

      await commandPlatformCheckBroker({ rootPath });

      const written = [...stdoutSpy.callsMatching([])];

      expect(written).toStrictEqual([
        [`${platformCrossingReportTransformer({ violations: [] })}\n`],
      ]);
      expect(process.exitCode).toBe(undefined);
    });
  });

  describe('valid inputs', () => {
    it('VALID: {one violation} => prints the FAIL report and sets the failing exit code', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const violation = PlatformCrossingViolationStub();
      const proxy = commandPlatformCheckBrokerProxy();
      proxy.setupViolations({ rootPath, violations: [violation] });
      const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);
      process.exitCode = undefined;

      await commandPlatformCheckBroker({ rootPath });

      const written = [...stdoutSpy.callsMatching([])];

      expect(written).toStrictEqual([
        [`${platformCrossingReportTransformer({ violations: [violation] })}\n`],
      ]);
      expect(process.exitCode).toBe(1);
    });
  });
});

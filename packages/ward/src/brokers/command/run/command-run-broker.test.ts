import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunBroker } from './command-run-broker';
import { commandRunBrokerProxy } from './command-run-broker.proxy';

describe('commandRunBroker', () => {
  describe('passing run', () => {
    it('VALID: {all checks pass} => writes summary to stdout, does not exit with 1', async () => {
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutFirstArg: proxy.getStdoutCalls()[0]?.[0],
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        stdoutFirstArg: [
          'run: 1739625600000-a38e',
          'lint:      WARN  0 files run',
          'typecheck: WARN  0 files run, 2 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'unit:      WARN  0 files run, 4 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'integration: WARN  0 files run, 4 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'e2e:       WARN  0 files run, 2 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          '',
        ].join('\n'),
        exitCalls: [],
      });
    });
  });

  describe('failing run', () => {
    it('VALID: {checks fail} => sets process.exitCode to 1 instead of calling process.exit', async () => {
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackageFail();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunBroker({ config, rootPath });

      expect({
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        exitCode: 1,
        exitCalls: [],
      });
    });
  });
});

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunBroker } from './command-run-broker';
import { commandRunBrokerProxy } from './command-run-broker.proxy';

describe('commandRunBroker', () => {
  describe('discovery mismatch run', () => {
    it('VALID: {checks discover files but process zero} => sets process.exitCode to 1 with mismatch guidance', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      await commandRunBroker({ config, rootPath });

      const stdoutCalls = proxy.getStdoutCalls();

      expect({
        summary: stdoutCalls[0]?.[0],
        guidance: stdoutCalls[1]?.[0],
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        summary: [
          'run: 1739625600000-a38e',
          'lint:      WARN  0 files run',
          'typecheck: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'unit:      WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'integration: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'e2e:       WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          '',
        ].join('\n'),
        guidance:
          '\nDISCOVERY MISMATCH — ward discovered files that were not processed (or vice versa). Every test must run; an unrun test is a hidden regression. This run is FAILING until each mismatch below is investigated and resolved at the root cause:\n  - typecheck\n  - unit\n  - integration\n  - e2e\n\nFor each check above: read the "only processed" / "only discovered" lines in the summary, then determine WHY discovery and processing diverged (e.g. test runner config drift from ward\'s discovery globs, untyped imports pulling in dist files, files matching a pattern they shouldn\'t, missing config exclusions). Fix the root cause — do not paper over the mismatch by adjusting ward\'s discovery to match the buggy state.\n',
        exitCode: 1,
        exitCalls: [],
      });
    });
  });

  describe('failing run', () => {
    it('VALID: {checks fail} => sets process.exitCode to 1 instead of calling process.exit', async () => {
      process.exitCode = 0;
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

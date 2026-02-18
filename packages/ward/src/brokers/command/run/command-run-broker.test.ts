import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunBroker } from './command-run-broker';
import { commandRunBrokerProxy } from './command-run-broker.proxy';

describe('commandRunBroker', () => {
  describe('passing run', () => {
    it('VALID: {all checks pass} => writes summary to stdout, does not exit with 1', async () => {
      const proxy = commandRunBrokerProxy();
      proxy.setupPassingRun({
        gitOutput: 'packages/ward/package.json\n',
        packageContents: [JSON.stringify({ name: '@dungeonmaster/ward' })],
        checkCount: 1,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      await commandRunBroker({ config, rootPath, isSubPackage: false, cwd: rootPath });

      expect(process.stdout.write).toHaveBeenCalledWith(
        expect.stringMatching(/^run: 1739625600000-a38e\n/u),
      );
      expect(process.exit).not.toHaveBeenCalled();
    });
  });
});

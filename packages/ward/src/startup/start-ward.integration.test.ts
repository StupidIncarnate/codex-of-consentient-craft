import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { StartWard } from './start-ward';
import { StartWardProxy } from './start-ward.proxy';

describe('start-ward integration', () => {
  describe('StartWard', () => {
    it('ERROR: {args: ["node", "ward", "unknown-command"]} => writes unknown command error to stderr', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-unknown-cmd' }),
      });

      const proxy = StartWardProxy();
      proxy.setupCwd({ cwd: testbed.guildPath });

      await StartWard({ args: ['node', 'ward', 'unknown-command'] });

      testbed.cleanup();

      expect(process.stderr.write).toHaveBeenCalledWith('Unknown command: unknown-command\n');
    });

    it('ERROR: {args: ["node", "ward", "detail"]} => writes usage error when missing args', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-detail-noargs' }),
      });

      const proxy = StartWardProxy();
      proxy.setupCwd({ cwd: testbed.guildPath });

      await StartWard({ args: ['node', 'ward', 'detail'] });

      testbed.cleanup();

      expect(process.stderr.write).toHaveBeenCalledWith(
        'Usage: ward detail <run-id> <file-path> [--verbose]\n',
      );
    });

    it('ERROR: {args: ["node", "ward", "raw"]} => writes usage error when missing args', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-raw-noargs' }),
      });

      const proxy = StartWardProxy();
      proxy.setupCwd({ cwd: testbed.guildPath });

      await StartWard({ args: ['node', 'ward', 'raw'] });

      testbed.cleanup();

      expect(process.stderr.write).toHaveBeenCalledWith('Usage: ward raw <run-id> <check-type>\n');
    });
  });
});

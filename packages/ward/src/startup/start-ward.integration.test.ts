import { StartWard } from './start-ward';
import { StartWardProxy } from './start-ward.proxy';

describe('start-ward integration', () => {
  describe('StartWard', () => {
    it('ERROR: {args: ["node", "ward", "unknown-command"]} => writes unknown command error to stderr', async () => {
      const proxy = StartWardProxy();
      proxy.setupCwd({ cwd: '/tmp/ward-unknown-cmd' });

      await StartWard({ args: ['node', 'ward', 'unknown-command'] });

      expect(process.stderr.write).toHaveBeenCalledWith('Unknown command: unknown-command\n');
    });

    it('ERROR: {args: ["node", "ward", "detail"]} => writes usage error when missing args', async () => {
      const proxy = StartWardProxy();
      proxy.setupCwd({ cwd: '/tmp/ward-detail-noargs' });

      await StartWard({ args: ['node', 'ward', 'detail'] });

      expect(process.stderr.write).toHaveBeenCalledWith(
        'Usage: ward detail <run-id> <file-path> [--verbose]\n',
      );
    });

    it('ERROR: {args: ["node", "ward", "raw"]} => writes usage error when missing args', async () => {
      const proxy = StartWardProxy();
      proxy.setupCwd({ cwd: '/tmp/ward-raw-noargs' });

      await StartWard({ args: ['node', 'ward', 'raw'] });

      expect(process.stderr.write).toHaveBeenCalledWith('Usage: ward raw <run-id> <check-type>\n');
    });
  });
});

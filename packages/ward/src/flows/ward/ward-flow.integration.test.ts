import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardFlow } from './ward-flow';

const VALID_RUN_ID = '1739625600000-a3f1';
const VALID_WARD_RESULT = JSON.stringify({
  runId: VALID_RUN_ID,
  timestamp: 1739625600000,
  filters: {},
  checks: [],
});

describe('WardFlow', () => {
  describe('detail command routing', () => {
    it('ERROR: {args: ["node", "ward", "detail"]} with missing runId => routes to WardDetailResponder and resolves', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/tmp/ward-flow-detail-missing' });

      await expect(WardFlow({ args: ['node', 'ward', 'detail'], rootPath })).resolves.toStrictEqual(
        { success: true },
      );
    });

    it('VALID: {args: ["node", "ward", "detail", runId, filePath]} with no matching result => routes to WardDetailResponder and resolves', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/tmp/ward-flow-detail-no-result' });

      await expect(
        WardFlow({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, 'src/index.ts'],
          rootPath,
        }),
      ).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {args: ["node", "ward", "detail", runId, filePath]} with existing ward result => routes to WardDetailResponder and resolves', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-flow-detail-result' }),
      });

      const wardResultRelativePath = RelativePathStub({ value: `.ward/run-${VALID_RUN_ID}.json` });

      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: VALID_WARD_RESULT }),
      });

      await WardFlow({
        args: ['node', 'ward', 'detail', VALID_RUN_ID, 'src/index.ts'],
        rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(testbed.readFile({ relativePath: wardResultRelativePath })).toBe(null);
    });
  });

  describe('raw command routing', () => {
    it('ERROR: {args: ["node", "ward", "raw"]} with missing runId and checkType => routes to WardRawResponder and resolves', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/tmp/ward-flow-raw-missing' });

      await expect(WardFlow({ args: ['node', 'ward', 'raw'], rootPath })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {args: ["node", "ward", "raw", runId, checkType]} with no matching result => routes to WardRawResponder and resolves', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/tmp/ward-flow-raw-no-result' });

      await expect(
        WardFlow({
          args: ['node', 'ward', 'raw', VALID_RUN_ID, 'lint'],
          rootPath,
        }),
      ).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {args: ["node", "ward", "raw", runId, checkType]} with existing ward result => routes to WardRawResponder and resolves', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-flow-raw-result' }),
      });

      const wardResultRelativePath = RelativePathStub({ value: `.ward/run-${VALID_RUN_ID}.json` });

      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: VALID_WARD_RESULT }),
      });

      await WardFlow({
        args: ['node', 'ward', 'raw', VALID_RUN_ID, 'lint'],
        rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(testbed.readFile({ relativePath: wardResultRelativePath })).toBe(null);
    });
  });

  describe('unknown command routing', () => {
    it('ERROR: {args: ["node", "ward", "unknown-command"]} => writes error to stderr and resolves', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/tmp/ward-flow-unknown' });

      await expect(
        WardFlow({ args: ['node', 'ward', 'unknown-command'], rootPath }),
      ).resolves.toStrictEqual({ success: true });
    });
  });
});

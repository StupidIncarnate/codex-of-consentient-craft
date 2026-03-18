import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { WardHandleResponderProxy } from './ward-handle-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('WardHandleResponder', () => {
  describe('ward-detail', () => {
    it('VALID: {filePath} => returns ward detail text', async () => {
      const proxy = WardHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'ward-detail' }),
        args: { runId: '1234-abc', filePath: 'src/app.ts' },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('VALID: {filePath, verbose} => returns verbose ward detail text', async () => {
      const proxy = WardHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'ward-detail' }),
        args: { runId: '1234-abc', filePath: 'src/app.ts', verbose: true },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = WardHandleResponderProxy();
      proxy.setupDetailStorageThrows({ error: new Error('Ward detail failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'ward-detail' }),
        args: { runId: '1234-abc', filePath: 'src/app.ts' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Ward detail failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });
});

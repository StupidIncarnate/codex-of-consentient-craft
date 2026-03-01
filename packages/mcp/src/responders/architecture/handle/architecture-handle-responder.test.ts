import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { ArchitectureHandleResponderProxy } from './architecture-handle-responder.proxy';

describe('ArchitectureHandleResponder', () => {
  describe('get-architecture', () => {
    it('VALID: {tool: get-architecture} => returns architecture overview text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-architecture' }),
        args: {},
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('get-syntax-rules', () => {
    it('VALID: {tool: get-syntax-rules} => returns syntax rules text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-syntax-rules' }),
        args: {},
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('get-testing-patterns', () => {
    it('VALID: {tool: get-testing-patterns} => returns testing patterns text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-testing-patterns' }),
        args: {},
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('get-folder-detail', () => {
    it('VALID: {tool: get-folder-detail, folderType: brokers} => returns folder detail text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-folder-detail' }),
        args: { folderType: 'brokers' },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('unknown tool', () => {
    it('ERROR: {tool: unknown-tool} => throws unknown tool error', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'unknown-tool' }),
          args: {},
        }),
      ).rejects.toThrow(/Unknown architecture tool/u);
    });
  });
});

import { hookFlowImportExtractTransformer } from './hook-flow-import-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('hookFlowImportExtractTransformer', () => {
  describe('source with flows import', () => {
    it('VALID: {import from flows/} => returns the flow import path', () => {
      const source = ContentTextStub({
        value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
      });

      const result = hookFlowImportExtractTransformer({ source });

      expect(result).toBe('../flows/hook-pre-edit/hook-pre-edit-flow');
    });

    it('VALID: {import from responders/} => returns the responder import path', () => {
      const source = ContentTextStub({
        value: `import { HookPreEditResponder } from '../responders/hook/pre-edit/hook-pre-edit-responder';`,
      });

      const result = hookFlowImportExtractTransformer({ source });

      expect(result).toBe('../responders/hook/pre-edit/hook-pre-edit-responder');
    });
  });

  describe('source with multiple imports', () => {
    it('VALID: {shared import then flow import} => returns the first flow import', () => {
      const source = ContentTextStub({
        value: [
          `import type { AdapterResult } from '@dungeonmaster/shared/contracts';`,
          `import { HookPreBashFlow } from '../flows/hook-pre-bash/hook-pre-bash-flow';`,
        ].join('\n'),
      });

      const result = hookFlowImportExtractTransformer({ source });

      expect(result).toBe('../flows/hook-pre-bash/hook-pre-bash-flow');
    });
  });

  describe('source without flows or responders import', () => {
    it('EMPTY: {only shared imports} => returns undefined', () => {
      const source = ContentTextStub({
        value: `import type { AdapterResult } from '@dungeonmaster/shared/contracts';`,
      });

      const result = hookFlowImportExtractTransformer({ source });

      expect(result).toBe(undefined);
    });
  });
});

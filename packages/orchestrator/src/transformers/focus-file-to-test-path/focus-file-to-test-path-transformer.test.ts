import { StepFileReferenceStub } from '@dungeonmaster/shared/contracts';

import { focusFileToTestPathTransformer } from './focus-file-to-test-path-transformer';

describe('focusFileToTestPathTransformer', () => {
  describe('unit test paths', () => {
    it('VALID: {ts file with unit testType} => returns .test.ts path', () => {
      const ref = StepFileReferenceStub({
        path: 'src/guards/is-valid/is-valid-guard.ts',
      });

      const result = focusFileToTestPathTransformer({
        focusPath: ref.path,
        testType: 'unit',
      });

      expect(result).toBe('src/guards/is-valid/is-valid-guard.test.ts');
    });

    it('VALID: {tsx file with unit testType} => returns .test.tsx path', () => {
      const ref = StepFileReferenceStub({
        path: 'src/widgets/quest-chat/quest-chat-widget.tsx',
      });

      const result = focusFileToTestPathTransformer({
        focusPath: ref.path,
        testType: 'unit',
      });

      expect(result).toBe('src/widgets/quest-chat/quest-chat-widget.test.tsx');
    });
  });

  describe('integration test paths', () => {
    it('VALID: {ts file with integration testType} => returns .integration.test.ts path', () => {
      const ref = StepFileReferenceStub({
        path: 'src/flows/mcp-server/mcp-server-flow.ts',
      });

      const result = focusFileToTestPathTransformer({
        focusPath: ref.path,
        testType: 'integration',
      });

      expect(result).toBe('src/flows/mcp-server/mcp-server-flow.integration.test.ts');
    });
  });

  describe('no test required', () => {
    it('VALID: {testType none} => returns undefined', () => {
      const ref = StepFileReferenceStub({
        path: 'src/statics/config/config-statics.ts',
      });

      const result = focusFileToTestPathTransformer({
        focusPath: ref.path,
        testType: 'none',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {focusPath: undefined} => returns undefined', () => {
      const result = focusFileToTestPathTransformer({
        testType: 'unit',
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {testType: undefined} => returns undefined', () => {
      const ref = StepFileReferenceStub({
        path: 'src/guards/is-valid/is-valid-guard.ts',
      });

      const result = focusFileToTestPathTransformer({
        focusPath: ref.path,
      });

      expect(result).toBe(undefined);
    });
  });
});

import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questStepCompanionFileMismatchTransformer } from './quest-step-companion-file-mismatch-transformer';

describe('questStepCompanionFileMismatchTransformer', () => {
  describe('valid steps', () => {
    it('VALID: {adapters step with .proxy.ts in accompanyingFiles} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-axios-get-adapter' as never,
        focusFile: {
          path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.test.ts' as never,
          },
          {
            path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.proxy.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {brokers step with .proxy.ts in accompanyingFiles} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        focusFile: {
          path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.proxy.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {widgets .tsx step with .proxy.tsx in accompanyingFiles} => returns []', () => {
      const step = DependencyStepStub({
        id: 'frontend-create-user-card-widget' as never,
        focusFile: {
          path: 'packages/web/src/widgets/user-card/user-card-widget.tsx' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/web/src/widgets/user-card/user-card-widget.proxy.tsx' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {contracts step with .stub.ts in accompanyingFiles} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-user-contract' as never,
        focusFile: {
          path: 'packages/shared/src/contracts/user/user-contract.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/shared/src/contracts/user/user.stub.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid steps', () => {
    it('INVALID: {adapters step missing .proxy.ts} => returns offender description', () => {
      const step = DependencyStepStub({
        id: 'backend-create-axios-get-adapter' as never,
        focusFile: {
          path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.test.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([
        "step 'backend-create-axios-get-adapter' is missing required companion '.proxy.ts' for folder type 'adapters' (expected 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.proxy.ts')",
      ]);
    });

    it('INVALID: {contracts step missing .stub.ts} => returns offender description', () => {
      const step = DependencyStepStub({
        id: 'backend-create-user-contract' as never,
        focusFile: {
          path: 'packages/shared/src/contracts/user/user-contract.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/shared/src/contracts/user/user-contract.test.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([
        "step 'backend-create-user-contract' is missing required companion '.stub.ts' for folder type 'contracts' (expected 'packages/shared/src/contracts/user/user.stub.ts')",
      ]);
    });
  });

  describe('focusAction steps', () => {
    it('EDGE: {step with focusAction (no focusFile)} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-verify-ward' as never,
        focusFile: undefined,
        focusAction: {
          kind: 'verification',
          description: 'Run ward and assert zero failures' as never,
        },
        accompanyingFiles: [],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('folder types with no companion requirement', () => {
    it('EDGE: {statics step with no proxy or stub in accompanyingFiles} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-rate-limit-statics' as never,
        focusFile: {
          path: 'packages/orchestrator/src/statics/rate-limit/rate-limit-statics.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/statics/rate-limit/rate-limit-statics.test.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {transformers step with no proxy or stub in accompanyingFiles} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-format-date-transformer' as never,
        focusFile: {
          path: 'packages/orchestrator/src/transformers/format-date/format-date-transformer.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/transformers/format-date/format-date-transformer.test.ts' as never,
          },
        ],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questStepCompanionFileMismatchTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questStepCompanionFileMismatchTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unknown folder type', () => {
    it('EDGE: {step with focusFile path outside src/[folderType]/} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-config' as never,
        focusFile: {
          path: 'packages/orchestrator/some-random/path/file.ts' as never,
        },
        accompanyingFiles: [],
      });

      const result = questStepCompanionFileMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });
  });
});

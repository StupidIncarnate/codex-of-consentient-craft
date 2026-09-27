import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';
import { PlatformCrossingViolationStub } from '../../../contracts/platform-crossing-violation/platform-crossing-violation.stub';
import { DuplicateInstallViolationStub } from '../../../contracts/duplicate-install-violation/duplicate-install-violation.stub';
import { platformCrossingViolationDisplayTransformer } from '../../../transformers/platform-crossing-violation-display/platform-crossing-violation-display-transformer';
import { duplicateInstallViolationDisplayTransformer } from '../../../transformers/duplicate-install-violation-display/duplicate-install-violation-display-transformer';

import { platformDedupeCheckLayerBroker } from './platform-dedupe-check-layer-broker';
import { platformDedupeCheckLayerBrokerProxy } from './platform-dedupe-check-layer-broker.proxy';

describe('platformDedupeCheckLayerBroker', () => {
  describe('lint not selected', () => {
    it('EMPTY: {checkTypes: ["typecheck"]} => returns undefined without calling either check', async () => {
      platformDedupeCheckLayerBrokerProxy();
      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await platformDedupeCheckLayerBroker({
        rootPath,
        checkTypes: ['typecheck'],
        passthrough: undefined,
      });

      expect(result).toBe(undefined);
    });
  });

  describe('scoped run that names neither a package.json nor a gateway file', () => {
    it('EMPTY: {checkTypes: ["lint"], passthrough: ordinary file} => returns undefined without calling either check', async () => {
      platformDedupeCheckLayerBrokerProxy();
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const { passthrough } = WardConfigStub({ passthrough: ['packages/web/src/index.ts'] });

      const result = await platformDedupeCheckLayerBroker({
        rootPath,
        checkTypes: ['lint'],
        passthrough,
      });

      expect(result).toBe(undefined);
    });
  });

  describe('triggered and clean', () => {
    it('EMPTY: {checkTypes: ["lint"], no passthrough, neither check finds anything} => returns undefined', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const proxy = platformDedupeCheckLayerBrokerProxy();
      proxy.setupClean({ rootPath });

      const result = await platformDedupeCheckLayerBroker({
        rootPath,
        checkTypes: ['lint'],
        passthrough: undefined,
      });

      expect(result).toBe(undefined);
    });
  });

  describe('triggered by a whole-repo run, platform-crossing finds a violation', () => {
    it('VALID: {checkTypes: ["lint"], no passthrough, one platform-crossing violation} => returns a failing ProjectResult carrying the display text', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const violation = PlatformCrossingViolationStub();
      const proxy = platformDedupeCheckLayerBrokerProxy();
      proxy.setupViolations({ rootPath, platformViolations: [violation] });

      const result = await platformDedupeCheckLayerBroker({
        rootPath,
        checkTypes: ['lint'],
        passthrough: undefined,
      });

      expect(result).toStrictEqual({
        projectFolder: { name: '(platform + dedupe)', path: '/project' },
        status: 'fail',
        errors: [
          {
            filePath: 'web',
            line: 0,
            column: 0,
            message: platformCrossingViolationDisplayTransformer({ violation }),
            rule: 'platform-crossing',
            severity: 'error',
          },
        ],
        elsewhereErrors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });
  });

  describe('triggered by a scoped run naming a gateway file, duplicate-install finds a violation', () => {
    it('VALID: {checkTypes: ["lint"], passthrough names a gateway file, one duplicate-install violation} => returns a failing ProjectResult carrying the display text', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const violation = DuplicateInstallViolationStub();
      const proxy = platformDedupeCheckLayerBrokerProxy();
      proxy.setupViolations({ rootPath, duplicateViolations: [violation] });
      const { passthrough } = WardConfigStub({ passthrough: ['packages/@gateway/npm/src/x.ts'] });

      const result = await platformDedupeCheckLayerBroker({
        rootPath,
        checkTypes: ['lint'],
        passthrough,
      });

      expect(result).toStrictEqual({
        projectFolder: { name: '(platform + dedupe)', path: '/project' },
        status: 'fail',
        errors: [
          {
            filePath: '@mantine/core',
            line: 0,
            column: 0,
            message: duplicateInstallViolationDisplayTransformer({ violation }),
            rule: 'duplicate-install',
            severity: 'error',
          },
        ],
        elsewhereErrors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });
  });

  describe('both checks find violations', () => {
    it('VALID: {one platform-crossing violation, one duplicate-install violation} => returns one ProjectResult carrying both errors', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const platformViolation = PlatformCrossingViolationStub();
      const duplicateViolation = DuplicateInstallViolationStub();
      const proxy = platformDedupeCheckLayerBrokerProxy();
      proxy.setupViolations({
        rootPath,
        platformViolations: [platformViolation],
        duplicateViolations: [duplicateViolation],
      });

      const result = await platformDedupeCheckLayerBroker({
        rootPath,
        checkTypes: ['lint'],
        passthrough: undefined,
      });

      expect(result?.errors).toStrictEqual([
        {
          filePath: 'web',
          line: 0,
          column: 0,
          message: platformCrossingViolationDisplayTransformer({ violation: platformViolation }),
          rule: 'platform-crossing',
          severity: 'error',
        },
        {
          filePath: '@mantine/core',
          line: 0,
          column: 0,
          message: duplicateInstallViolationDisplayTransformer({ violation: duplicateViolation }),
          rule: 'duplicate-install',
          severity: 'error',
        },
      ]);
    });
  });
});

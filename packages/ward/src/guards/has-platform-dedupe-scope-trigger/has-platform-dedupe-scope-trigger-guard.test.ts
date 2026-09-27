import { WardConfigStub } from '../../contracts/ward-config/ward-config.stub';

import { hasPlatformDedupeScopeTriggerGuard } from './has-platform-dedupe-scope-trigger-guard';

describe('hasPlatformDedupeScopeTriggerGuard', () => {
  describe('no file scope', () => {
    it('EMPTY: {passthrough: undefined} => returns true', () => {
      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough: undefined });

      expect(result).toBe(true);
    });

    it('EMPTY: {passthrough: []} => returns true', () => {
      const { passthrough } = WardConfigStub({ passthrough: [] });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(true);
    });
  });

  describe('scoped run naming a package.json', () => {
    it('VALID: {passthrough: ["package.json"]} => returns true', () => {
      const { passthrough } = WardConfigStub({ passthrough: ['package.json'] });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(true);
    });

    it('VALID: {passthrough: ["packages/ward/package.json"]} => returns true', () => {
      const { passthrough } = WardConfigStub({
        passthrough: ['packages/ward/package.json'],
      });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(true);
    });
  });

  describe('scoped run naming a gateway file', () => {
    it('VALID: {passthrough: ["packages/@gateway/npm/src/x.ts"]} => returns true', () => {
      const { passthrough } = WardConfigStub({
        passthrough: ['packages/@gateway/npm/src/x.ts'],
      });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(true);
    });

    it('VALID: {passthrough: ["packages/@gateway"]} => returns true', () => {
      const { passthrough } = WardConfigStub({ passthrough: ['packages/@gateway'] });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(true);
    });

    it('VALID: {one of several paths is a gateway file} => returns true', () => {
      const { passthrough } = WardConfigStub({
        passthrough: ['packages/web/src/index.ts', 'packages/@gateway/node/src/fs.ts'],
      });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(true);
    });
  });

  describe('scoped run naming neither', () => {
    it('INVALID: {passthrough: ["packages/web/src/index.ts"]} => returns false', () => {
      const { passthrough } = WardConfigStub({
        passthrough: ['packages/web/src/index.ts'],
      });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(false);
    });

    it('INVALID: {passthrough names a package folder that is not gateway} => returns false', () => {
      const { passthrough } = WardConfigStub({ passthrough: ['packages/web'] });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(false);
    });

    it('INVALID: {passthrough names a package whose name merely starts with @gateway} => returns false', () => {
      const { passthrough } = WardConfigStub({
        passthrough: ['packages/@gateway-extra/src/x.ts'],
      });

      const result = hasPlatformDedupeScopeTriggerGuard({ passthrough });

      expect(result).toBe(false);
    });
  });
});

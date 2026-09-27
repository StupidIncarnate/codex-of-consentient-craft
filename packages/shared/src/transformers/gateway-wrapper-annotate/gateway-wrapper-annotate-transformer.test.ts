import { gatewayWrapperAnnotateTransformer } from './gateway-wrapper-annotate-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { GatewayLintConfigStub } from '../../contracts/gateway-lint-config/gateway-lint-config.stub';

describe('gatewayWrapperAnnotateTransformer', () => {
  describe('no gateway config', () => {
    it('VALID: {empty gatewayLintConfig} => every wrapper name is unchanged', () => {
      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/node/fs' }),
        wrapperNames: [
          ContentTextStub({ value: 'existsSync' }),
          ContentTextStub({ value: 'readFileSync' }),
        ],
        gatewayLintConfig: GatewayLintConfigStub(),
      });

      expect(result).toStrictEqual(['existsSync', 'readFileSync']);
    });
  });

  describe('a banned export', () => {
    it('VALID: {name matches a bannedExports entry for this subpath} => marked banned with its replacement', () => {
      const gatewayLintConfig = GatewayLintConfigStub({
        bannedExports: [
          {
            subpath: '#gateway/node/fs__promises',
            name: 'readFile',
            use: 'readTextFile',
            reason: 'blocks the loop',
          },
        ],
      });

      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/node/fs__promises' }),
        wrapperNames: [
          ContentTextStub({ value: 'readFile' }),
          ContentTextStub({ value: 'writeFile' }),
        ],
        gatewayLintConfig,
      });

      expect(result).toStrictEqual(['readFile ✗ banned, use readTextFile', 'writeFile']);
    });

    it('VALID: {bannedExports entry names a different subpath} => not marked', () => {
      const gatewayLintConfig = GatewayLintConfigStub({
        bannedExports: [
          {
            subpath: '#gateway/node/fs',
            name: 'readFile',
            use: 'readTextFile',
            reason: 'blocks the loop',
          },
        ],
      });

      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/node/fs__promises' }),
        wrapperNames: [ContentTextStub({ value: 'readFile' })],
        gatewayLintConfig,
      });

      expect(result).toStrictEqual(['readFile']);
    });
  });

  describe('a restricted export', () => {
    it('VALID: {restrictedTo entry names this export} => marked with the bare package name', () => {
      const gatewayLintConfig = GatewayLintConfigStub({
        restrictedTo: [
          {
            subpath: '#gateway/bin/claude',
            name: 'spawnStreamJson',
            packages: ['@dungeonmaster/orchestrator'],
            reason: 'only orchestrator spawns',
          },
        ],
      });

      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/bin/claude' }),
        wrapperNames: [
          ContentTextStub({ value: 'resolveClaudeCliPath' }),
          ContentTextStub({ value: 'spawnStreamJson' }),
        ],
        gatewayLintConfig,
      });

      expect(result).toStrictEqual(['resolveClaudeCliPath', 'spawnStreamJson (orchestrator only)']);
    });

    it('VALID: {restrictedTo entry with multiple packages} => bare names joined with a comma', () => {
      const gatewayLintConfig = GatewayLintConfigStub({
        restrictedTo: [
          {
            subpath: '#gateway/bin/spawn',
            packages: ['@dungeonmaster/orchestrator', '@dungeonmaster/ward'],
            reason: 'only these two spawn',
          },
        ],
      });

      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/bin/spawn' }),
        wrapperNames: [ContentTextStub({ value: 'run' })],
        gatewayLintConfig,
      });

      expect(result).toStrictEqual(['run (orchestrator, ward only)']);
    });

    it('VALID: {restrictedTo entry has no name} => restricts every wrapper name in the subpath', () => {
      const gatewayLintConfig = GatewayLintConfigStub({
        restrictedTo: [
          {
            subpath: '#gateway/bin/spawn',
            packages: ['@dungeonmaster/orchestrator'],
            reason: 'only orchestrator spawns',
          },
        ],
      });

      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/bin/spawn' }),
        wrapperNames: [
          ContentTextStub({ value: 'run' }),
          ContentTextStub({ value: 'runDetached' }),
        ],
        gatewayLintConfig,
      });

      expect(result).toStrictEqual(['run (orchestrator only)', 'runDetached (orchestrator only)']);
    });
  });

  describe('empty wrapper names', () => {
    it('EMPTY: {wrapperNames: []} => returns an empty array', () => {
      const result = gatewayWrapperAnnotateTransformer({
        subpath: ContentTextStub({ value: '#gateway/npm/zod' }),
        wrapperNames: [],
        gatewayLintConfig: GatewayLintConfigStub(),
      });

      expect(result).toStrictEqual([]);
    });
  });
});

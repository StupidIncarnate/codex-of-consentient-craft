import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { locationLiteralKeyPathsTransformer } from './location-literal-key-paths-transformer';

describe('locationLiteralKeyPathsTransformer', () => {
  describe('flat object', () => {
    it('VALID: maps each retained string value to its dotted key path', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: { config: '.dungeonmaster.json', mcpJson: '.mcp.json' },
        rootName: 'locationsStatics.repoRoot',
        minRetainedLength: 8,
      });

      expect(Array.from(result.entries())).toStrictEqual([
        [PathSegmentStub({ value: '.dungeonmaster.json' }), 'locationsStatics.repoRoot.config'],
        [PathSegmentStub({ value: '.mcp.json' }), 'locationsStatics.repoRoot.mcpJson'],
      ]);
    });
  });

  describe('nested object', () => {
    it('VALID: walks into nested object properties producing a deep dotted path', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: {
          repoRoot: { claude: { settings: 'settings.json' } },
        },
        rootName: 'locationsStatics',
        minRetainedLength: 8,
      });

      expect(result.get(PathSegmentStub({ value: 'settings.json' }))).toBe(
        'locationsStatics.repoRoot.claude.settings',
      );
    });
  });

  describe('array members', () => {
    it('VALID: walks into array members and indexes the path', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: {
          eslintConfig: ['eslint.config.ts', 'eslint.config.js'],
        },
        rootName: 'locationsStatics.repoRoot',
        minRetainedLength: 8,
      });

      expect(result.get(PathSegmentStub({ value: 'eslint.config.ts' }))).toBe(
        'locationsStatics.repoRoot.eslintConfig[0]',
      );
      expect(result.get(PathSegmentStub({ value: 'eslint.config.js' }))).toBe(
        'locationsStatics.repoRoot.eslintConfig[1]',
      );
    });
  });

  describe('filter: short non-dot/non-slash literals', () => {
    it('EDGE: "design" (length 6) is dropped', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: { designDir: 'design' },
        rootName: 'locationsStatics.quest',
        minRetainedLength: 8,
      });

      expect(result.has(PathSegmentStub({ value: 'design' }))).toBe(false);
    });

    it('EDGE: "guilds" (length 6) is dropped', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: { guildsDir: 'guilds' },
        rootName: 'locationsStatics.dungeonmasterHome',
        minRetainedLength: 8,
      });

      expect(result.has(PathSegmentStub({ value: 'guilds' }))).toBe(false);
    });

    it('EDGE: "subagents" (length 9) is retained', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: { subagentsDir: 'subagents' },
        rootName: 'locationsStatics.userHome.claude',
        minRetainedLength: 8,
      });

      expect(result.get(PathSegmentStub({ value: 'subagents' }))).toBe(
        'locationsStatics.userHome.claude.subagentsDir',
      );
    });
  });

  describe('filter: dot/slash always retained', () => {
    it('EDGE: "guild.json" (length 10, contains dot) is retained even with high threshold', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: { guildConfigFile: 'guild.json' },
        rootName: 'locationsStatics.dungeonmasterHome',
        minRetainedLength: 100,
      });

      expect(result.get(PathSegmentStub({ value: 'guild.json' }))).toBe(
        'locationsStatics.dungeonmasterHome.guildConfigFile',
      );
    });

    it('EDGE: "node_modules/.bin" (contains slash) is retained', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: { nodeModulesBin: 'node_modules/.bin' },
        rootName: 'locationsStatics.repoRoot',
        minRetainedLength: 100,
      });

      expect(result.get(PathSegmentStub({ value: 'node_modules/.bin' }))).toBe(
        'locationsStatics.repoRoot.nodeModulesBin',
      );
    });
  });

  describe('first-occurrence-wins on duplicate string', () => {
    it('VALID: when the same literal appears at two key paths, only the first wins', () => {
      const result = locationLiteralKeyPathsTransformer({
        source: {
          a: { dir: '.claude' },
          b: { dir: '.claude' },
        },
        rootName: 'locationsStatics',
        minRetainedLength: 8,
      });

      expect(result.get(PathSegmentStub({ value: '.claude' }))).toBe('locationsStatics.a.dir');
    });
  });
});

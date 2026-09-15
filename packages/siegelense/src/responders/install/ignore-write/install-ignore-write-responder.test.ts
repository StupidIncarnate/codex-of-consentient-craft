import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';
import { InstallIgnoreWriteResponderProxy } from './install-ignore-write-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
  },
});

const ESLINT_CONFIG_WITH_WORKTREES = `module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'worktrees/**',
      'scripts/**',
    ],
  },
];
`;

const ESLINT_CONFIG_WITH_BOTH_ENTRIES = `module.exports = [
  {
    ignores: [
      'node_modules/**',
      'worktrees/**',
      '.siegelense/**',
      'scripts/**',
    ],
  },
];
`;

// `worktrees` sits as the LAST `exclude` entry, with no trailing comma — the shape a hand-written
// tsconfig.json (never run through prettier) actually takes, and the one that exercises the
// anchor-gains-a-comma rewrite.
const TSCONFIG_WITH_WORKTREES = `{
  // Comment above compilerOptions must survive an insert.
  "compilerOptions": {
    "noEmit": true
  },
  "exclude": [
    "node_modules",
    "worktrees"
  ]
}`;

const TSCONFIG_WITH_WORKTREES_AND_ENTRY = `{
  // Comment above compilerOptions must survive an insert.
  "compilerOptions": {
    "noEmit": true
  },
  "exclude": [
    "node_modules",
    "worktrees",
    ".siegelense/**"
  ]
}`;

const TSCONFIG_WITHOUT_WORKTREES = `{
  "exclude": [
    "node_modules",
    "dist"
  ]
}`;

const JEST_CONFIG_WITH_WORKTREES = `module.exports = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '/worktrees/',
    '/dist/',
  ],
};`;

const JEST_CONFIG_WITH_WORKTREES_AND_ENTRY = `module.exports = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '/worktrees/',
    '/.siegelense/',
    '/dist/',
  ],
};`;

const JEST_CONFIG_WITHOUT_WORKTREES = `module.exports = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};`;

describe('InstallIgnoreWriteResponder', () => {
  describe('gitignore: entry absent', () => {
    it('VALID: {no .gitignore entry, no eslint config} => appended once, resulting file carries the entry', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\nworktrees/\n' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message: 'Added .siegelense/ to existing .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe('node_modules/\nworktrees/\n.siegelense/\n');
    });
  });

  describe('gitignore: entry present', () => {
    it('VALID: {.gitignore already ignores .siegelense/} => file unchanged, but the read really happened', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe(undefined);
      expect(proxy.wasGitignoreRead()).toBe(true);
    });
  });

  describe('gitignore: file absent', () => {
    it('VALID: {no .gitignore on disk} => created, carrying the entry', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: false });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .siegelense/',
      });
      expect(proxy.getWrittenGitignore()).toBe('.siegelense/\n');
    });
  });

  describe('gitignore: idempotence across two runs', () => {
    it('VALID: {responder run twice against a fresh repo} => .siegelense/ appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: false });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenGitignore();

      proxy.setupGitignore({ present: true, content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe('.siegelense/\n');
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore',
      });
    });
  });

  describe('eslint config: worktrees excluded, .siegelense missing', () => {
    it('VALID: {eslint.config.js ignores worktrees/**, not .siegelense} => .siegelense/** inserted right beside it', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message: '.siegelense/ already in .gitignore; Added .siegelense/** to eslint ignores',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(
        `module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'worktrees/**',
      '.siegelense/**',
      'scripts/**',
    ],
  },
];
`,
      );
    });
  });

  describe('eslint config: .siegelense already present', () => {
    it('EDGE: {eslint.config.js already ignores .siegelense/**} => not appended a second time', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_WITH_BOTH_ENTRIES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore; .siegelense/** already in eslint ignores',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(undefined);
    });
  });

  describe('eslint config: no candidate file on disk', () => {
    it('EMPTY: {no eslint.config.* exists in the target repo} => only .gitignore is touched, no crash', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: false });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .siegelense/',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(undefined);
    });
  });

  describe('tsconfig exclude: worktrees excluded, .siegelense missing', () => {
    it('VALID: {tsconfig.json excludes worktrees as its last entry, not .siegelense} => .siegelense/** inserted right beside it', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTsconfig({ content: TSCONFIG_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message: '.siegelense/ already in .gitignore; Added .siegelense/** to tsconfig exclude',
      });
      expect(proxy.getWrittenTsconfig()).toBe(TSCONFIG_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('tsconfig exclude: .siegelense already present', () => {
    it('EDGE: {tsconfig.json already excludes .siegelense/**} => not appended a second time', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTsconfig({ content: TSCONFIG_WITH_WORKTREES_AND_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore; .siegelense/** already in tsconfig exclude',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
      expect(proxy.wasTsconfigRead()).toBe(true);
    });
  });

  describe('tsconfig exclude: worktrees not excluded', () => {
    it('EDGE: {tsconfig.json exclude has no worktrees entry} => nothing written to tsconfig.json, and that is a success rather than a failure', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTsconfig({ content: TSCONFIG_WITHOUT_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
    });
  });

  describe('tsconfig exclude: no tsconfig.json on disk', () => {
    it('EMPTY: {no tsconfig.json exists in the target repo} => only .gitignore is touched, no crash', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: false });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .siegelense/',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
    });
  });

  describe('tsconfig exclude: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose tsconfig.json excludes worktrees} => .siegelense/** appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTsconfig({ content: TSCONFIG_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenTsconfig();

      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTsconfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(TSCONFIG_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore; .siegelense/** already in tsconfig exclude',
      });
    });
  });

  describe('jest testPathIgnorePatterns: worktrees excluded, .siegelense missing', () => {
    it('VALID: {jest.config.js ignores /worktrees/, not /.siegelense/} => /.siegelense/ inserted right beside it', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.siegelense/ already in .gitignore; Added /.siegelense/ to jest testPathIgnorePatterns',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(JEST_CONFIG_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('jest testPathIgnorePatterns: .siegelense already present', () => {
    it('EDGE: {jest.config.js already ignores /.siegelense/} => not appended a second time', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITH_WORKTREES_AND_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.siegelense/ already in .gitignore; /.siegelense/ already in jest testPathIgnorePatterns',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(undefined);
      expect(proxy.wasTestRunnerConfigRead()).toBe(true);
    });
  });

  describe('jest testPathIgnorePatterns: worktrees not excluded', () => {
    it('EDGE: {jest.config.js testPathIgnorePatterns has no worktrees entry} => nothing written to jest.config.js, and that is a success rather than a failure', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITHOUT_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense/ already in .gitignore',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(undefined);
    });
  });

  describe('jest testPathIgnorePatterns: no jest config on disk', () => {
    it('EMPTY: {no jest.config.js or jest.config.cjs exists in the target repo} => only .gitignore is touched, no crash', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: false });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .siegelense/',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(undefined);
    });
  });

  describe('jest testPathIgnorePatterns: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose jest config ignores worktrees} => /.siegelense/ appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenTestRunnerConfig();

      proxy.setupGitignore({ present: true, content: 'node_modules/\n.siegelense/\n' });
      proxy.setupTestRunnerConfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(JEST_CONFIG_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.siegelense/ already in .gitignore; /.siegelense/ already in jest testPathIgnorePatterns',
      });
    });
  });
});

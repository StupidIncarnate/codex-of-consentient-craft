import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';
import { InstallIgnoreWriteResponderProxy } from './install-ignore-write-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
  },
});

// The gitignore section's own tests build this content by hand where the exact shape matters; every
// OTHER section below reaches for this baseline whenever it just needs the gitignore half already
// satisfied, so its own result message stays focused on the surface that test is really about.
const GITIGNORE_ALREADY_SATISFIED = 'node_modules/\n.dungeonmaster-assets/siegelense-assets\n';

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
      'siegelense-assets/**',
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

// The anchor is BARE (`worktrees`, no slash), so the inserted sibling is bare too.
const TSCONFIG_WITH_WORKTREES_AND_ENTRY = `{
  // Comment above compilerOptions must survive an insert.
  "compilerOptions": {
    "noEmit": true
  },
  "exclude": [
    "node_modules",
    "worktrees",
    "siegelense-assets"
  ]
}`;

// A repo left over from a run that inserted the wrong shape: `siegelense-assets/**` beside a BARE
// `worktrees` anchor. `alreadyPresent` detection is shape-agnostic — any of the three candidate
// shapes counts as present — so this is recognized as already covered and left untouched, never
// rewritten to match its neighbour after the fact.
const TSCONFIG_WITH_WORKTREES_AND_MISMATCHED_ENTRY = `{
  // Comment above compilerOptions must survive an insert.
  "compilerOptions": {
    "noEmit": true
  },
  "exclude": [
    "node_modules",
    "worktrees",
    "siegelense-assets/**"
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
    '/siegelense-assets/',
    '/dist/',
  ],
};`;

const JEST_CONFIG_WITHOUT_WORKTREES = `module.exports = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};`;

// Prettier keeps a short array on ONE line until it exceeds print width, and this repo's own
// jest.config.base.js writes testPathIgnorePatterns exactly this way — one line, not one entry per
// line — so these three single-line fixtures exercise the shape a great many consumer repos
// actually have on disk, not just the one-entry-per-line shape above.
const ESLINT_CONFIG_INLINE_WITH_WORKTREES = `module.exports = [
  {
    ignores: ['node_modules/**', 'worktrees/**', 'scripts/**'],
  },
];
`;

const ESLINT_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY = `module.exports = [
  {
    ignores: ['node_modules/**', 'worktrees/**', 'siegelense-assets/**', 'scripts/**'],
  },
];
`;

// The exact scratch shape from the gap report: a comment above compilerOptions, and exclude packed
// onto one line as its own bare worktrees entry.
const TSCONFIG_INLINE_WITH_WORKTREES = `{
  // scratch tsconfig
  "compilerOptions": { "strict": true },
  "exclude": ["node_modules", "worktrees"]
}`;

const TSCONFIG_INLINE_WITH_WORKTREES_AND_ENTRY = `{
  // scratch tsconfig
  "compilerOptions": { "strict": true },
  "exclude": ["node_modules", "worktrees", "siegelense-assets"]
}`;

const JEST_CONFIG_INLINE_WITH_WORKTREES = `module.exports = {
  testPathIgnorePatterns: ['/node_modules/', '/worktrees/', '/dist/'],
};`;

const JEST_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY = `module.exports = {
  testPathIgnorePatterns: ['/node_modules/', '/worktrees/', '/siegelense-assets/', '/dist/'],
};`;

describe('InstallIgnoreWriteResponder', () => {
  describe('gitignore: entry absent', () => {
    it('VALID: {no .gitignore entry, no eslint config} => appended once, resulting file carries the entry', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: 'node_modules/\nworktrees/\n' });

      const result = await proxy.callResponder({ context: CONTEXT });

      // A trailing slash means "directory only" to git, and a symlink is never a directory to git
      // even when it points at one — so a slash-suffixed pattern never matches `siegelense-assets`.
      // Bare, it matches a file, a directory, AND a symlink. Confirmed live: git check-ignore -v
      // exits 1 against a trailing-slash entry and exits 0 (matched) against a bare one.
      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message: 'Added .dungeonmaster-assets/siegelense-assets to existing .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe(
        'node_modules/\nworktrees/\n.dungeonmaster-assets/siegelense-assets\n',
      );
    });
  });

  describe('gitignore: entry present', () => {
    it('VALID: {.gitignore already ignores the nested siegelense-assets child} => file unchanged, but the read really happened', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster-assets/siegelense-assets already in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe(undefined);
      expect(proxy.wasGitignoreRead()).toBe(true);
    });
  });

  describe('gitignore: legacy trailing-slash entry present', () => {
    it('VALID: {.gitignore still carries the old .siegelense/ line, which never matched the symlink at any point} => the line is replaced in place with the current nested pattern, not left dead beside a new one', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({
        present: true,
        content: 'node_modules/\n.siegelense/\nworktrees/\n',
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          'Replaced stale .siegelense/ with .dungeonmaster-assets/siegelense-assets in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe(
        'node_modules/\n.dungeonmaster-assets/siegelense-assets\nworktrees/\n',
      );
    });
  });

  describe('gitignore: legacy bare entry present', () => {
    it('VALID: {.gitignore still carries the bare .siegelense line from before this path nested under .dungeonmaster-assets/} => the line is replaced in place with the current nested pattern', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({
        present: true,
        content: 'node_modules/\n.siegelense\nworktrees/\n',
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          'Replaced stale .siegelense with .dungeonmaster-assets/siegelense-assets in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe(
        'node_modules/\n.dungeonmaster-assets/siegelense-assets\nworktrees/\n',
      );
    });
  });

  describe('gitignore: an unrelated .dungeonmaster-assets parent line is never mistaken for our own entry', () => {
    it('VALID: {.gitignore already ignores the bare .dungeonmaster-assets parent, for some unrelated reason} => the scoped child entry is still added, and the parent line is left exactly as it was', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({
        present: true,
        content: 'node_modules/\n.dungeonmaster-assets\n',
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      // The written entry is the CHILD path, never the bare parent this repo already carried — a
      // committed oddities file lives directly in that parent, so a pattern that ignored it would
      // hide a tracked file from git.
      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message: 'Added .dungeonmaster-assets/siegelense-assets to existing .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe(
        'node_modules/\n.dungeonmaster-assets\n.dungeonmaster-assets/siegelense-assets\n',
      );
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
        message: 'Created .gitignore with .dungeonmaster-assets/siegelense-assets',
      });
      expect(proxy.getWrittenGitignore()).toBe('.dungeonmaster-assets/siegelense-assets\n');
    });
  });

  describe('gitignore: idempotence across two runs', () => {
    it('VALID: {responder run twice against a fresh repo} => the entry appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: false });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenGitignore();

      proxy.setupGitignore({ present: true, content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe('.dungeonmaster-assets/siegelense-assets\n');
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster-assets/siegelense-assets already in .gitignore',
      });
    });
  });

  describe('eslint config: worktrees excluded, siegelense-assets missing', () => {
    it('VALID: {eslint.config.js ignores worktrees/**, not siegelense-assets} => siegelense-assets/** inserted right beside it', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; Added siegelense-assets/** to eslint ignores',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(
        `module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'worktrees/**',
      'siegelense-assets/**',
      'scripts/**',
    ],
  },
];
`,
      );
    });
  });

  describe('eslint config: siegelense-assets already present', () => {
    it('EDGE: {eslint.config.js already ignores siegelense-assets/**} => not appended a second time', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_WITH_BOTH_ENTRIES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets/** already in eslint ignores',
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
        message: 'Created .gitignore with .dungeonmaster-assets/siegelense-assets',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(undefined);
    });
  });

  describe('tsconfig exclude: worktrees excluded, siegelense-assets missing', () => {
    it('VALID: {tsconfig.json excludes worktrees as its last, BARE entry, not siegelense-assets} => siegelense-assets inserted right beside it, bare like its neighbour', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; Added siegelense-assets to tsconfig exclude',
      });
      expect(proxy.getWrittenTsconfig()).toBe(TSCONFIG_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('tsconfig exclude: siegelense-assets already present', () => {
    it('EDGE: {tsconfig.json already excludes siegelense-assets, in a shape that does not match its bare worktrees neighbour} => not appended a second time, and the mismatched shape is left alone', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_WITH_WORKTREES_AND_MISMATCHED_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets/** already in tsconfig exclude',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
      expect(proxy.wasTsconfigRead()).toBe(true);
    });
  });

  describe('tsconfig exclude: worktrees not excluded', () => {
    it('EDGE: {tsconfig.json exclude has no worktrees entry} => nothing written to tsconfig.json, and that is a success rather than a failure', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_WITHOUT_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster-assets/siegelense-assets already in .gitignore',
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
        message: 'Created .gitignore with .dungeonmaster-assets/siegelense-assets',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
    });
  });

  describe('tsconfig exclude: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose tsconfig.json excludes worktrees} => siegelense-assets appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenTsconfig();

      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(TSCONFIG_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets already in tsconfig exclude',
      });
    });
  });

  describe('jest testPathIgnorePatterns: worktrees excluded, siegelense-assets missing', () => {
    it('VALID: {jest.config.js ignores /worktrees/, not /siegelense-assets/} => /siegelense-assets/ inserted right beside it', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; Added /siegelense-assets/ to jest testPathIgnorePatterns',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(JEST_CONFIG_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('jest testPathIgnorePatterns: siegelense-assets already present', () => {
    it('EDGE: {jest.config.js already ignores /siegelense-assets/} => not appended a second time', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITH_WORKTREES_AND_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; /siegelense-assets/ already in jest testPathIgnorePatterns',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(undefined);
      expect(proxy.wasTestRunnerConfigRead()).toBe(true);
    });
  });

  describe('jest testPathIgnorePatterns: worktrees not excluded', () => {
    it('EDGE: {jest.config.js testPathIgnorePatterns has no worktrees entry} => nothing written to jest.config.js, and that is a success rather than a failure', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITHOUT_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster-assets/siegelense-assets already in .gitignore',
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
        message: 'Created .gitignore with .dungeonmaster-assets/siegelense-assets',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(undefined);
    });
  });

  describe('jest testPathIgnorePatterns: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose jest config ignores worktrees} => /siegelense-assets/ appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenTestRunnerConfig();

      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(JEST_CONFIG_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; /siegelense-assets/ already in jest testPathIgnorePatterns',
      });
    });
  });

  describe('eslint config, single-line ignores array: worktrees excluded, siegelense-assets missing', () => {
    it('VALID: {ignores packed on one line, anchor present, entry absent} => siegelense-assets/** inserted inline after worktrees/**', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_INLINE_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; Added siegelense-assets/** to eslint ignores',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(ESLINT_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('eslint config, single-line ignores array: siegelense-assets already present inline', () => {
    it('EDGE: {ignores packed on one line, already carries siegelense-assets/**} => not appended a second time, zero writes, but the read really happened', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets/** already in eslint ignores',
      });
      expect(proxy.getWrittenEslintConfig()).toBe(undefined);
    });
  });

  describe('eslint config, single-line ignores array: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose eslint ignores is packed on one line} => siegelense-assets/** appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupEslintConfig({ content: ESLINT_CONFIG_INLINE_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenEslintConfig();

      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupEslintConfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(ESLINT_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets/** already in eslint ignores',
      });
    });
  });

  describe('tsconfig exclude, single-line array: worktrees excluded, siegelense-assets missing', () => {
    it('VALID: {exclude packed on one line, comment above compilerOptions, anchor present, entry absent} => siegelense-assets inserted inline, comment preserved', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_INLINE_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; Added siegelense-assets to tsconfig exclude',
      });
      expect(proxy.getWrittenTsconfig()).toBe(TSCONFIG_INLINE_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('tsconfig exclude, single-line array: siegelense-assets already present inline', () => {
    it('EDGE: {exclude packed on one line, already carries siegelense-assets} => not appended a second time, zero writes, but the read really happened', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_INLINE_WITH_WORKTREES_AND_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets already in tsconfig exclude',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
      expect(proxy.wasTsconfigRead()).toBe(true);
    });
  });

  describe('tsconfig exclude, single-line array: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose tsconfig exclude is packed on one line} => siegelense-assets appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: TSCONFIG_INLINE_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenTsconfig();

      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(TSCONFIG_INLINE_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; siegelense-assets already in tsconfig exclude',
      });
    });
  });

  describe('tsconfig exclude, single-line array: a comment mentions worktrees but is not an entry', () => {
    it("EDGE: {// still exclude 'worktrees' via legacy config, above a single-line exclude that does not itself exclude worktrees} => nothing written, and that is a success rather than a failure", async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({
        content: [
          '{',
          "  // still exclude 'worktrees' via legacy config",
          '  "exclude": ["node_modules", "dist"]',
          '}',
        ].join('\n'),
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster-assets/siegelense-assets already in .gitignore',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
    });
  });

  describe('tsconfig exclude, single-line array: a longer path contains the anchor word but is not equal to it', () => {
    it('EDGE: {"exclude": ["node_modules", "src/worktrees-helper.ts"]} => not read as the worktrees anchor, nothing written', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTsconfig({
        content: '{\n  "exclude": ["node_modules", "src/worktrees-helper.ts"]\n}',
      });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster-assets/siegelense-assets already in .gitignore',
      });
      expect(proxy.getWrittenTsconfig()).toBe(undefined);
    });
  });

  describe('jest testPathIgnorePatterns, single-line array: worktrees excluded, siegelense-assets missing', () => {
    it("VALID: {testPathIgnorePatterns packed on one line, the shape this repo's own jest.config.base.js uses, anchor present, entry absent} => /siegelense-assets/ inserted inline", async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_INLINE_WITH_WORKTREES });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'merged',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; Added /siegelense-assets/ to jest testPathIgnorePatterns',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(JEST_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY);
    });
  });

  describe('jest testPathIgnorePatterns, single-line array: siegelense-assets already present inline', () => {
    it('EDGE: {testPathIgnorePatterns packed on one line, already carries /siegelense-assets/} => not appended a second time, zero writes, but the read really happened', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; /siegelense-assets/ already in jest testPathIgnorePatterns',
      });
      expect(proxy.getWrittenTestRunnerConfig()).toBe(undefined);
      expect(proxy.wasTestRunnerConfigRead()).toBe(true);
    });
  });

  describe('jest testPathIgnorePatterns, single-line array: idempotence across two runs', () => {
    it('VALID: {responder run twice against a repo whose jest testPathIgnorePatterns is packed on one line} => /siegelense-assets/ appears exactly once, not twice', async () => {
      const proxy = InstallIgnoreWriteResponderProxy();
      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: JEST_CONFIG_INLINE_WITH_WORKTREES });

      await proxy.callResponder({ context: CONTEXT });
      const afterFirstRun = proxy.getWrittenTestRunnerConfig();

      proxy.setupGitignore({ present: true, content: GITIGNORE_ALREADY_SATISFIED });
      proxy.setupTestRunnerConfig({ content: String(afterFirstRun) });
      const secondResult = await proxy.callResponder({ context: CONTEXT });

      expect(afterFirstRun).toBe(JEST_CONFIG_INLINE_WITH_WORKTREES_AND_ENTRY);
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already in .gitignore; /siegelense-assets/ already in jest testPathIgnorePatterns',
      });
    });
  });
});

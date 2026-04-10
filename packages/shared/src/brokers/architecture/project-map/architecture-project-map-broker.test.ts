import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { architectureProjectMapBrokerProxy } from './architecture-project-map-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureProjectMapBroker', () => {
  describe('monorepo with multiple packages', () => {
    it('VALID: monorepo with two packages and descriptions => returns map with both package sections and descriptions', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'web',
            description: ContentTextStub({ value: 'Web UI' }),
            folders: [
              {
                name: 'contracts',
                entries: [
                  { name: 'chat-entry', isDir: true },
                  { name: 'quest-id', isDir: true },
                ],
              },
              {
                name: 'brokers',
                entries: [{ name: 'guild', isDir: true }],
                subEntries: {
                  guild: [
                    { name: 'create', isDir: true },
                    { name: 'list', isDir: true },
                  ],
                },
              },
            ],
          },
          {
            name: 'shared',
            description: ContentTextStub({ value: 'Shared utilities' }),
            folders: [
              {
                name: 'statics',
                entries: [{ name: 'folder-config', isDir: true }],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## shared (3 files) \u2014 Shared utilities',
            '  statics/ (3) \u2014 folder-config',
            '',
            '## web (12 files) \u2014 Web UI',
            '  brokers/ (6) \u2014 guild (create, list)',
            '  contracts/ (6) \u2014 chat-entry, quest-id',
          ].join('\n'),
        }),
      );
    });
  });

  describe('depth 1 folder type', () => {
    it('VALID: contracts folder => lists first-level subdirectory names', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'contracts',
                entries: [
                  { name: 'chat-entry', isDir: true },
                  { name: 'quest-id', isDir: true },
                  { name: 'user-input', isDir: true },
                ],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (9 files)',
            '  contracts/ (9) \u2014 chat-entry, quest-id, user-input',
          ].join('\n'),
        }),
      );
    });
  });

  describe('depth 2 folder type', () => {
    it('VALID: brokers folder => lists domain (action1, action2) pairs', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'brokers',
                entries: [
                  { name: 'guild', isDir: true },
                  { name: 'quest', isDir: true },
                ],
                subEntries: {
                  guild: [
                    { name: 'create', isDir: true },
                    { name: 'list', isDir: true },
                  ],
                  quest: [
                    { name: 'modify', isDir: true },
                    { name: 'start', isDir: true },
                  ],
                },
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (12 files)',
            '  brokers/ (12) \u2014 guild (create, list), quest (modify, start)',
          ].join('\n'),
        }),
      );
    });
  });

  describe('depth 0 folder type', () => {
    it('VALID: startup folder => lists file names directly', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'startup',
                entries: [
                  { name: 'start-app.ts', isDir: false },
                  { name: 'start-server.ts', isDir: false },
                ],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (2 files)',
            '  startup/ (2) \u2014 start-app, start-server',
          ].join('\n'),
        }),
      );
    });
  });

  describe('non-monorepo', () => {
    it('VALID: no packages/ dir with description => scans root src/ as single package with description', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/single-project' });

      proxy.setupSingleRepo({
        folders: [
          {
            name: 'contracts',
            entries: [{ name: 'user', isDir: true }],
          },
        ],
        description: ContentTextStub({ value: 'A single repo app' }),
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## root (3 files) \u2014 A single repo app',
            '  contracts/ (3) \u2014 user',
          ].join('\n'),
        }),
      );
    });
  });

  describe('empty src', () => {
    it('EMPTY: empty src/ => minimal output with empty label', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/empty-project' });

      proxy.setupEmptySrc();

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['# Codebase Map', '', '## root (0 files)', '  (empty)'].join('\n'),
        }),
      );
    });
  });

  describe('level 1 — empty packages', () => {
    it('EDGE: monorepo package with no folder types => shows empty label', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'mock-rails',
            folders: [],
          },
          {
            name: 'web',
            folders: [
              {
                name: 'contracts',
                entries: [{ name: 'user', isDir: true }],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## mock-rails (0 files)',
            '  (empty)',
            '',
            '## web (3 files)',
            '  contracts/ (3) — user',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: single repo with empty src => shows empty label', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/empty-project' });

      proxy.setupEmptySrc();

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['# Codebase Map', '', '## root (0 files)', '  (empty)'].join('\n'),
        }),
      );
    });
  });

  describe('level 2 — empty folder types', () => {
    it('EDGE: monorepo folder type with 0 files => folder type still shown with (0) count', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'cli',
            folders: [
              {
                name: 'bin',
                entries: [],
              },
              {
                name: 'brokers',
                entries: [{ name: 'guild', isDir: true }],
                subEntries: {
                  guild: [
                    { name: 'create', isDir: true },
                    { name: 'list', isDir: true },
                  ],
                },
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## cli (6 files)',
            '  bin/ (0)',
            '  brokers/ (6) — guild (create, list)',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: single repo folder type with 0 files => folder type still shown with (0) count', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/single-project' });

      proxy.setupSingleRepo({
        folders: [
          {
            name: 'bin',
            entries: [],
          },
          {
            name: 'contracts',
            entries: [{ name: 'user', isDir: true }],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## root (3 files)',
            '  bin/ (0)',
            '  contracts/ (3) — user',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: monorepo with all folder types empty => folder types shown with (0) counts', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'empty-pkg',
            folders: [
              {
                name: 'bin',
                entries: [],
              },
              {
                name: 'assets',
                entries: [],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## empty-pkg (0 files)',
            '  assets/ (0)',
            '  bin/ (0)',
          ].join('\n'),
        }),
      );
    });
  });

  describe('level 3 — empty content within folder types', () => {
    it('EDGE: depth 1 folder with mix of empty and non-empty subdirs => only non-empty subdirs in content', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'contracts',
                entries: [
                  { name: 'chat-entry', isDir: true },
                  { name: 'empty-contract', isDir: true },
                  { name: 'quest-id', isDir: true },
                ],
                subEntries: {
                  'empty-contract': [],
                },
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (6 files)',
            '  contracts/ (6) — chat-entry, quest-id',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: depth 2 folder with empty domain => empty domain excluded from content', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'brokers',
                entries: [
                  { name: 'guild', isDir: true },
                  { name: 'quest', isDir: true },
                ],
                subEntries: {
                  guild: [
                    { name: 'create', isDir: true },
                    { name: 'list', isDir: true },
                  ],
                  quest: [],
                },
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (6 files)',
            '  brokers/ (6) — guild (create, list)',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: depth 2 domain with mix of empty and non-empty actions => only non-empty actions listed', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'brokers',
                entries: [{ name: 'guild', isDir: true }],
                subEntries: {
                  guild: [
                    { name: 'create', isDir: true },
                    { name: 'delete', isDir: true },
                    { name: 'list', isDir: true },
                  ],
                },
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (9 files)',
            '  brokers/ (9) — guild (create, delete, list)',
          ].join('\n'),
        }),
      );
    });

    it('EDGE: single repo depth 1 with empty subdirs => only non-empty subdirs in content', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/single-project' });

      proxy.setupSingleRepo({
        folders: [
          {
            name: 'contracts',
            entries: [
              { name: 'user', isDir: true },
              { name: 'empty-type', isDir: true },
              { name: 'quest', isDir: true },
            ],
            subEntries: {
              'empty-type': [],
            },
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['# Codebase Map', '', '## root (6 files)', '  contracts/ (6) — quest, user'].join(
            '\n',
          ),
        }),
      );
    });
  });

  describe('description handling', () => {
    it('VALID: package with no description => no description separator shown', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'tools',
            folders: [
              {
                name: 'contracts',
                entries: [{ name: 'config', isDir: true }],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['# Codebase Map', '', '## tools (3 files)', '  contracts/ (3) — config'].join(
            '\n',
          ),
        }),
      );
    });
  });

  describe('folder content formatting', () => {
    it('VALID: folder type with files but no subdirectories => shows file count without content summary', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'guards',
                entries: [
                  { name: 'is-active-guard.ts', isDir: false },
                  { name: 'is-valid-guard.ts', isDir: false },
                ],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: ['# Codebase Map', '', '## app (2 files)', '  guards/ (2)'].join('\n'),
        }),
      );
    });

    it('VALID: depth 2 folder with domain that has only files => shows domain name without parentheses', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'app',
            folders: [
              {
                name: 'brokers',
                entries: [
                  { name: 'quest', isDir: true },
                  { name: 'guild', isDir: true },
                ],
                subEntries: {
                  quest: [
                    { name: 'start', isDir: true },
                    { name: 'stop', isDir: true },
                  ],
                  guild: [
                    { name: 'config.ts', isDir: false },
                    { name: 'readme.md', isDir: false },
                  ],
                },
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## app (8 files)',
            '  brokers/ (8) — guild, quest (start, stop)',
          ].join('\n'),
        }),
      );
    });
  });

  describe('alphabetical sorting', () => {
    it('VALID: packages and folders sorted alphabetically regardless of input order', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'zeta',
            folders: [
              {
                name: 'widgets',
                entries: [{ name: 'app', isDir: true }],
              },
              {
                name: 'contracts',
                entries: [{ name: 'user', isDir: true }],
              },
            ],
          },
          {
            name: 'alpha',
            folders: [
              {
                name: 'statics',
                entries: [{ name: 'config', isDir: true }],
              },
            ],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: [
            '# Codebase Map',
            '',
            '## alpha (3 files)',
            '  statics/ (3) — config',
            '',
            '## zeta (6 files)',
            '  contracts/ (3) — user',
            '  widgets/ (3) — app',
          ].join('\n'),
        }),
      );
    });
  });
});

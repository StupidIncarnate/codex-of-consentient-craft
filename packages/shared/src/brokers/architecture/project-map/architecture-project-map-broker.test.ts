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
});

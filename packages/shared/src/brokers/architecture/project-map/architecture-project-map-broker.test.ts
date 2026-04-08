import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { architectureProjectMapBrokerProxy } from './architecture-project-map-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('architectureProjectMapBroker', () => {
  describe('monorepo with multiple packages', () => {
    it('VALID: monorepo with two packages => returns map with both package sections', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      proxy.setupMonorepo({
        packages: [
          {
            name: 'web',
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

      expect(result).toMatch(/^# Codebase Map$/mu);
      expect(result).toMatch(/^## shared \(\d+ files\)$/mu);
      expect(result).toMatch(/^## web \(\d+ files\)$/mu);
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

      expect(result).toMatch(/^ {2}contracts\/ \(\d+\) — chat-entry, quest-id, user-input$/mu);
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

      expect(result).toMatch(
        /^ {2}brokers\/ \(\d+\) — guild \(create, list\), quest \(modify, start\)$/mu,
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

      expect(result).toMatch(/^ {2}startup\/ \(\d+\) — start-app, start-server$/mu);
    });
  });

  describe('non-monorepo', () => {
    it('VALID: no packages/ dir => scans root src/ as single package', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/single-project' });

      proxy.setupSingleRepo({
        folders: [
          {
            name: 'contracts',
            entries: [{ name: 'user', isDir: true }],
          },
        ],
      });

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toMatch(/^# Codebase Map$/mu);
      expect(result).toMatch(/^## root \(\d+ files\)$/mu);
      expect(result).toMatch(/^ {2}contracts\/ \(\d+\) — user$/mu);
    });
  });

  describe('empty src', () => {
    it('EMPTY: empty src/ => minimal output with empty label', () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/empty-project' });

      proxy.setupEmptySrc();

      const result = architectureProjectMapBroker({ projectRoot });

      expect(result).toMatch(/^# Codebase Map$/mu);
      expect(result).toMatch(/^## root \(0 files\)$/mu);
      expect(result).toMatch(/^ {2}\(empty\)$/mu);
    });
  });
});

import { architectureSideChannelBroker } from './architecture-side-channel-broker';
import { architectureSideChannelBrokerProxy } from './architecture-side-channel-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
const PACKAGE_NAME = ContentTextStub({ value: '@dungeonmaster/orchestrator' });

const EMITTER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
});
const CONSUMER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts',
});

describe('architectureSideChannelBroker', () => {
  describe('no ws or file-bus edges', () => {
    it('EMPTY: {no source files} => returns empty string', () => {
      const proxy = architectureSideChannelBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = architectureSideChannelBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      expect(String(result)).toBe('');
    });

    it('EMPTY: {source files with no edges for this package} => returns empty string', () => {
      const proxy = architectureSideChannelBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') {",
            }),
          },
        ],
      });

      // CONSUMER_FILE is in server package, not orchestrator, so orchestrator has no edges
      const result = architectureSideChannelBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      expect(String(result)).toBe('');
    });
  });

  describe('package with WS emit edges', () => {
    it('VALID: {emitter in this package} => output starts with --- separator', () => {
      const proxy = architectureSideChannelBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') {",
            }),
          },
        ],
      });

      const result = architectureSideChannelBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('---');
      expect(lines.some((l) => l.startsWith('## Side-channel'))).toBe(true);
      expect(lines.some((l) => l === '```')).toBe(true);
    });

    it('VALID: {3 emit events from same emitter file} => renders all event types in output', () => {
      const proxy = architectureSideChannelBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: [
                "orchestrationEventsState.emit({ type: 'chat-output', payload });",
                "orchestrationEventsState.emit({ type: 'quest-modified', data });",
                "orchestrationEventsState.emit({ type: 'slot-update', slot });",
              ].join('\n'),
            }),
          },
        ],
      });

      const result = architectureSideChannelBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const text = String(result);
      const lines = text.split('\n');

      expect(lines.some((l) => l === '  │    event types: chat-output')).toBe(true);
      expect(lines.some((l) => l === '  │                 quest-modified')).toBe(true);
      expect(lines.some((l) => l === '  │                 slot-update')).toBe(true);
    });
  });

  describe('consumer-only package', () => {
    it('VALID: {consumer file under server packageRoot} => renders subscriber section', () => {
      const serverRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });
      const proxy = architectureSideChannelBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
          {
            path: CONSUMER_FILE,
            source: ContentTextStub({
              value: "if (parsed.data.type === 'chat-output') {",
            }),
          },
        ],
      });

      const result = architectureSideChannelBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: serverRoot,
        packageName: ContentTextStub({ value: '@dungeonmaster/server' }),
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('---');
      expect(
        lines.some(
          (l) =>
            l ===
            'server/adapters/orchestrator/events-on/events-on-adapter        (in-memory bus subscriber)',
        ),
      ).toBe(true);
    });
  });
});

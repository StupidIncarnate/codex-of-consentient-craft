import { eventsSectionRenderLayerBroker } from './events-section-render-layer-broker';
import { eventsSectionRenderLayerBrokerProxy } from './events-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
const STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
});
const OTHER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/brokers/quest/quest-broker.ts',
});

describe('eventsSectionRenderLayerBroker', () => {
  describe('no events emitted', () => {
    it('EMPTY: {no source files} => header present and empty notice shown', () => {
      const proxy = eventsSectionRenderLayerBrokerProxy();
      proxy.setupEmpty();

      const result = eventsSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineProgrammaticServiceStatics.eventsSectionHeader);
      expect(
        lines.some((l) => l === projectMapHeadlineProgrammaticServiceStatics.eventsSectionEmpty),
      ).toBe(true);
    });

    it('EMPTY: {source file with no emit calls} => empty notice shown', () => {
      const proxy = eventsSectionRenderLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: OTHER_FILE,
            source: ContentTextStub({ value: 'export const doThing = () => {};\n' }),
          },
        ],
      });

      const result = eventsSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineProgrammaticServiceStatics.eventsSectionEmpty),
      ).toBe(true);
    });
  });

  describe('events emitted', () => {
    it('VALID: {source file with one emit} => event type shown in output', () => {
      const proxy = eventsSectionRenderLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: STATE_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
        ],
      });

      const result = eventsSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === "'chat-output'")).toBe(true);
    });

    it('VALID: {source file with two different emits} => both event types shown', () => {
      const proxy = eventsSectionRenderLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: STATE_FILE,
            source: ContentTextStub({
              value: [
                "orchestrationEventsState.emit({ type: 'chat-output', payload });",
                "orchestrationEventsState.emit({ type: 'quest-session-linked', data });",
              ].join('\n'),
            }),
          },
        ],
      });

      const result = eventsSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === "'chat-output'")).toBe(true);
      expect(lines.some((l) => l === "'quest-session-linked'")).toBe(true);
    });

    it('VALID: {duplicate emit type across files} => deduplicated in output', () => {
      const proxy = eventsSectionRenderLayerBrokerProxy();
      const file2 = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts',
      });

      proxy.setup({
        sourceFiles: [
          {
            path: STATE_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
          {
            path: file2,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
        ],
      });

      const result = eventsSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');
      const chatOutputLines = lines.filter((l) => l === "'chat-output'");

      expect(chatOutputLines).toStrictEqual(["'chat-output'"]);
    });

    it('VALID: {events present} => output wrapped in fenced code block', () => {
      const proxy = eventsSectionRenderLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: STATE_FILE,
            source: ContentTextStub({
              value: "orchestrationEventsState.emit({ type: 'chat-output', payload });",
            }),
          },
        ],
      });

      const result = eventsSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '```')).toBe(true);
    });
  });
});

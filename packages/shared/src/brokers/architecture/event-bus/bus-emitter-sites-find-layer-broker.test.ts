import { busEmitterSitesFindLayerBroker } from './bus-emitter-sites-find-layer-broker';
import { busEmitterSitesFindLayerBrokerProxy } from './bus-emitter-sites-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { EventBusStub } from '../../../contracts/event-bus/event-bus.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/state/my-bus/my-bus-state.ts',
});
const EMITTER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/responders/emitter/emitter-responder.ts',
});

describe('busEmitterSitesFindLayerBroker', () => {
  describe('no buses', () => {
    it('EMPTY: {empty buses array} => returns empty array', () => {
      const proxy = busEmitterSitesFindLayerBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = busEmitterSitesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('responder emits to known bus', () => {
    it('VALID: {single emit, single bus} => returns one BusEmitterSite', () => {
      const proxy = busEmitterSitesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: EMITTER_FILE,
            source: ContentTextStub({
              value: "myBus.emit({ type: 'chat-output', payload });",
            }),
          },
        ],
      });

      const result = busEmitterSitesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: ContentTextStub({ value: 'myBus' }),
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          emitterFile: EMITTER_FILE,
          eventType: ContentTextStub({ value: 'chat-output' }),
          busExportName: ContentTextStub({ value: 'myBus' }),
        },
      ]);
    });
  });

  describe('bus state file itself is excluded', () => {
    it('EMPTY: {state file body containing emit definition} => not treated as emitter site', () => {
      const proxy = busEmitterSitesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: STATE_FILE,
            source: ContentTextStub({
              // The bus state file's own body contains `emit:` and a generic call —
              // but we exclude the state file itself from emitter-site discovery.
              value: 'export const myBus = { emit: ({ type }) => { /* myBus.emit literal */ } };',
            }),
          },
        ],
      });

      const result = busEmitterSitesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        buses: [
          EventBusStub({
            stateFile: STATE_FILE,
            exportName: ContentTextStub({ value: 'myBus' }),
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });
});

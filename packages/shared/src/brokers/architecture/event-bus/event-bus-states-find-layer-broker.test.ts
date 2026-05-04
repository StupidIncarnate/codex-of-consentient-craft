import { eventBusStatesFindLayerBroker } from './event-bus-states-find-layer-broker';
import { eventBusStatesFindLayerBrokerProxy } from './event-bus-states-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const BUS_STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/state/my-bus/my-bus-state.ts',
});
const NON_BUS_STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/state/counter/counter-state.ts',
});
const NON_STATE_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/foo/src/responders/some-responder.ts',
});

describe('eventBusStatesFindLayerBroker', () => {
  describe('no source files', () => {
    it('EMPTY: {no files} => returns empty array', () => {
      const proxy = eventBusStatesFindLayerBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = eventBusStatesFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('state file exports object with on + emit', () => {
    it('VALID: {bus shape under state/} => returns EventBus entry', () => {
      const proxy = eventBusStatesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: BUS_STATE_FILE,
            source: ContentTextStub({
              value:
                'export const myBus = {\n  emit: ({ type }) => {},\n  on: ({ type, handler }) => {},\n};',
            }),
          },
        ],
      });

      const result = eventBusStatesFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          stateFile: BUS_STATE_FILE,
          exportName: ContentTextStub({ value: 'myBus' }),
        },
      ]);
    });
  });

  describe('state file exports object missing on or emit', () => {
    it('EMPTY: {has emit but no on} => excluded', () => {
      const proxy = eventBusStatesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: NON_BUS_STATE_FILE,
            source: ContentTextStub({
              value: 'export const counter = { emit: () => {} };',
            }),
          },
        ],
      });

      const result = eventBusStatesFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('file with bus shape but outside state/ folder', () => {
    it('EMPTY: {responder file with bus shape} => excluded', () => {
      const proxy = eventBusStatesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: NON_STATE_FILE,
            source: ContentTextStub({
              value: 'export const responder = { emit: () => {}, on: () => {} };',
            }),
          },
        ],
      });

      const result = eventBusStatesFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});

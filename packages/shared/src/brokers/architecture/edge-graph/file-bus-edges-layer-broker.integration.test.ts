import { fileBusEdgesLayerBroker } from './file-bus-edges-layer-broker';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { cwd as getCwd } from '#gateway/node/process';

const cwd = getCwd();
const projectRoot = AbsoluteFilePathStub({
  value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
});

describe('fileBusEdgesLayerBroker (integration with real monorepo)', () => {
  it('VALID: {real monorepo} => the orchestrator event outbox pairs each of its writers with its tailer', () => {
    const edges = fileBusEdgesLayerBroker({ projectRoot });

    const outboxEdges = edges
      .filter(
        (edge) => edge.filePath === '<computed: locationsStatics.dungeonmasterHome.eventOutbox>',
      )
      .sort((a, b) => String(a.writerFile).localeCompare(String(b.writerFile)));

    expect(outboxEdges).toStrictEqual([
      {
        filePath: '<computed: locationsStatics.dungeonmasterHome.eventOutbox>',
        writerFile: AbsoluteFilePathStub({
          value: `${projectRoot}/packages/hydration-recipes/src/brokers/quest/persist-direct/quest-persist-direct-broker.ts`,
        }),
        watcherFile: AbsoluteFilePathStub({
          value: `${projectRoot}/packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts`,
        }),
        paired: true,
      },
      {
        filePath: '<computed: locationsStatics.dungeonmasterHome.eventOutbox>',
        writerFile: AbsoluteFilePathStub({
          value: `${projectRoot}/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts`,
        }),
        watcherFile: AbsoluteFilePathStub({
          value: `${projectRoot}/packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts`,
        }),
        paired: true,
      },
    ]);
  });
});

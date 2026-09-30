import { fileBusEdgesLayerBroker } from './file-bus-edges-layer-broker';
import { cwd as getCwd } from '#gateway/node/process';

const cwd = getCwd();
const projectRoot = cwd.slice(0, cwd.lastIndexOf('/packages/'));

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
        writerFile: `${projectRoot}/packages/hydration-recipes/src/brokers/quest/persist-direct/quest-persist-direct-broker.ts`,
        watcherFile: `${projectRoot}/packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts`,
        paired: true,
      },
      {
        filePath: '<computed: locationsStatics.dungeonmasterHome.eventOutbox>',
        writerFile: `${projectRoot}/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts`,
        watcherFile: `${projectRoot}/packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts`,
        paired: true,
      },
    ]);
  });
});

/**
 * PURPOSE: Builds the `readServerLogSince`/`serverLogLength` closures `lane-boot-broker` attaches to
 * a `LaneSession`, over the FIRST process a spec declares — both built-in specs put the `api`
 * process at index 0, and a process list is never empty (`laneSpecContract` refines on it), so this
 * needs no portRole lookup to stay well-defined for any spec. Reads happen by BYTE offset off disk
 * rather than from an in-memory buffer: a spawned process's stdout/stderr is redirected straight to
 * a raw OS fd (`openForAppendSync`), so nothing in this process ever sees the bytes it writes — unlike
 * `BrowserSession`'s console/network/websocket lines, which arrive over Playwright's own event
 * stream.
 *
 * USAGE:
 * const { readServerLogSince, serverLogLength } = serverLogReaderLayerBroker({
 *   logPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/api-server.log' }),
 * });
 * serverLogLength(); // the file's current byte length
 * readServerLogSince({ fromByte: 0 }); // every non-empty line, from the start
 */

import { readFileSync } from '#gateway/node/fs';

import { Buffer } from '#gateway/node/buffer';

export const serverLogReaderLayerBroker = ({
  logPath,
}: {
  logPath: string;
}): {
  readServerLogSince: ({ fromByte }: { fromByte: number }) => readonly string[];
  serverLogLength: () => number;
} => ({
  serverLogLength: (): number => {
    const content = readFileSync(logPath);
    return Buffer.byteLength(content, 'utf8');
  },

  readServerLogSince: ({ fromByte }: { fromByte: number }): readonly string[] => {
    const content = readFileSync(logPath);
    const sliced = Buffer.from(content, 'utf8').subarray(fromByte).toString('utf8');

    return sliced
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => line);
  },
});

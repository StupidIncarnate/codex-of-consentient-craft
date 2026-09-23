/**
 * PURPOSE: Builds the `readServerLogSince`/`serverLogLength` closures `lane-boot-broker` attaches to
 * a `LaneSession`, over the FIRST process a spec declares — both built-in specs put the `api`
 * process at index 0, and a process list is never empty (`laneSpecContract` refines on it), so this
 * needs no portRole lookup to stay well-defined for any spec. Reads happen by BYTE offset off disk
 * rather than from an in-memory buffer: a spawned process's stdout/stderr is redirected straight to
 * a raw OS fd (`fsOpenFdAdapter`), so nothing in this process ever sees the bytes it writes — unlike
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

import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { serverLogByteCountContract } from '../../../contracts/server-log-byte-count/server-log-byte-count-contract';
import type { ServerLogByteCount } from '../../../contracts/server-log-byte-count/server-log-byte-count-contract';

export const serverLogReaderLayerBroker = ({
  logPath,
}: {
  logPath: AbsoluteFilePath;
}): {
  readServerLogSince: ({ fromByte }: { fromByte: number }) => readonly ContentText[];
  serverLogLength: () => ServerLogByteCount;
} => ({
  serverLogLength: (): ServerLogByteCount => {
    const content = fsReadFileSyncAdapter({ filePath: logPath });
    return serverLogByteCountContract.parse(Buffer.byteLength(content, 'utf8'));
  },

  readServerLogSince: ({ fromByte }: { fromByte: number }): readonly ContentText[] => {
    const content = fsReadFileSyncAdapter({ filePath: logPath });
    const sliced = Buffer.from(content, 'utf8').subarray(fromByte).toString('utf8');

    return sliced
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => contentTextContract.parse(line));
  },
});

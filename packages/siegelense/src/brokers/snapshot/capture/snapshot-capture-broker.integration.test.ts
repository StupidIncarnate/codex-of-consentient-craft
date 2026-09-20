import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { snapshotCaptureBroker } from './snapshot-capture-broker';
import { snapshotIndexReadBroker } from '../index-read/snapshot-index-read-broker';
import { snapshotResolveBroker } from '../resolve/snapshot-resolve-broker';
import { SnapshotNameStub } from '../../../contracts/snapshot-name/snapshot-name.stub';
import { snapshotIndexCollapseTransformer } from '../../../transformers/snapshot-index-collapse/snapshot-index-collapse-transformer';

describe('snapshotCaptureBroker against a real filesystem', () => {
  describe('the automatic pair across two runs', () => {
    it('VALID: {four captures} => the index reads back run_1:start, run_1:end, run_2:start and run_2:end, every one manual false', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-capture-pair' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"created"}' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/home` });

      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:start' }),
        manual: false,
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:end' }),
        manual: false,
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_2:start' }),
        manual: false,
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_2:end' }),
        manual: false,
      });

      const records = await snapshotIndexReadBroker({ homePath });
      const current = snapshotIndexCollapseTransformer({ records });

      testbed.cleanup();

      expect(
        current.map((record) => ({
          name: record.name,
          manual: record.manual,
          path: record.path,
        })),
      ).toStrictEqual([
        {
          name: 'run_1:start',
          manual: false,
          path: `${testbed.guildPath}/home/.siegelense-snapshots/1`,
        },
        {
          name: 'run_1:end',
          manual: false,
          path: `${testbed.guildPath}/home/.siegelense-snapshots/2`,
        },
        {
          name: 'run_2:start',
          manual: false,
          path: `${testbed.guildPath}/home/.siegelense-snapshots/3`,
        },
        {
          name: 'run_2:end',
          manual: false,
          path: `${testbed.guildPath}/home/.siegelense-snapshots/4`,
        },
      ]);
    });
  });

  describe('what the payload actually holds', () => {
    it('VALID: {a home holding a quest file} => the payload holds that file, byte for byte', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-capture-payload' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"created"}' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/home` });

      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'clean' }),
        manual: true,
      });

      const copied = testbed.readFile({
        relativePath: RelativePathStub({
          value: 'home/.siegelense-snapshots/1/guilds/g1/quest.json',
        }),
      });

      testbed.cleanup();

      expect(copied).toBe('{"status":"created"}');
    });

    it('VALID: {a second capture} => the payload never contains the snapshot store itself', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-capture-no-recursion' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"created"}' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/home` });

      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'first' }),
        manual: true,
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'second' }),
        manual: true,
      });

      // The second payload is taken with the store already holding an index and payload 1, so this
      // is the copy that would recurse if the exclusion were not real.
      const secondPayloadEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'home/.siegelense-snapshots/2' }),
      });

      testbed.cleanup();

      expect(secondPayloadEntries).toStrictEqual(['guilds']);
    });

    it('VALID: {the home mutated between two captures} => the two payloads hold different contents', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-capture-mutation' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"created"}' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/home` });

      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:start' }),
        manual: false,
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"complete"}' }),
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:end' }),
        manual: false,
      });

      const atStart = testbed.readFile({
        relativePath: RelativePathStub({
          value: 'home/.siegelense-snapshots/1/guilds/g1/quest.json',
        }),
      });
      const atEnd = testbed.readFile({
        relativePath: RelativePathStub({
          value: 'home/.siegelense-snapshots/2/guilds/g1/quest.json',
        }),
      });

      testbed.cleanup();

      expect([atStart, atEnd]).toStrictEqual(['{"status":"created"}', '{"status":"complete"}']);
    });
  });

  describe('resolving a name against a real index', () => {
    it('VALID: {name: run_1:start} => resolves to the record pointing at payload directory 1', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-resolve-hit' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"created"}' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/home` });

      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:start' }),
        manual: false,
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:end' }),
        manual: false,
      });

      const resolved = await snapshotResolveBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:start' }),
      });

      testbed.cleanup();

      expect({ name: resolved.name, manual: resolved.manual, path: resolved.path }).toStrictEqual({
        name: 'run_1:start',
        manual: false,
        path: `${testbed.guildPath}/home/.siegelense-snapshots/1`,
      });
    });

    it('ERROR: {name: run_1:strt} => throws naming the miss and listing both real names, never falling back to the nearest', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-resolve-miss' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'home/guilds/g1/quest.json' }),
        content: FileContentStub({ value: '{"status":"created"}' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/home` });

      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:start' }),
        manual: false,
      });
      await snapshotCaptureBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:end' }),
        manual: false,
      });

      const outcome: unknown = await snapshotResolveBroker({
        homePath,
        name: SnapshotNameStub({ value: 'run_1:strt' }),
      }).catch((error: unknown) => String(error));

      testbed.cleanup();

      expect(outcome).toBe(
        'SnapshotMissingError: No snapshot named "run_1:strt" on this instance — it is never resolved to the nearest one. Snapshots that exist: run_1:start, run_1:end.',
      );
    });
  });

  describe('an instance whose home was removed, the way kill removes it', () => {
    it('EMPTY: {no home at all} => the index reads back empty rather than throwing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'snapshot-index-gone' }),
      });
      const homePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/never-booted` });

      const records = await snapshotIndexReadBroker({ homePath });

      testbed.cleanup();

      expect(records).toStrictEqual([]);
    });
  });
});

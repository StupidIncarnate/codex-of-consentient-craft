import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsCpAdapter } from './fs-cp-adapter';
import { fsCpAdapterProxy } from './fs-cp-adapter.proxy';

const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });
const PAYLOAD_PATH = AbsoluteFilePathStub({
  value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
});

describe('fsCpAdapter', () => {
  describe('copying a directory of children', () => {
    it('VALID: {two entries, no exclusion} => copies both children and reports success', async () => {
      const proxy = fsCpAdapterProxy();
      proxy.succeeds({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        entries: ['guilds', 'claude-queue'],
      });

      const result = await fsCpAdapter({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        excludeName: null,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopiedPairs()).toStrictEqual([
        [
          '/tmp/dm-siege-inst_7f3a9c21/guilds',
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1/guilds',
        ],
        [
          '/tmp/dm-siege-inst_7f3a9c21/claude-queue',
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1/claude-queue',
        ],
      ]);
    });

    it('VALID: {each child} => is copied with recursive and force', async () => {
      const proxy = fsCpAdapterProxy();
      proxy.succeeds({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        entries: ['guilds'],
      });

      await fsCpAdapter({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        excludeName: null,
      });

      expect(
        proxy.getOptionsFor({
          sourceEntryPath: AbsoluteFilePathStub({
            value: '/tmp/dm-siege-inst_7f3a9c21/guilds',
          }),
        }),
      ).toStrictEqual({ recursive: true, force: true });
    });

    it('EMPTY: {no entries} => copies nothing and still reports success', async () => {
      const proxy = fsCpAdapterProxy();
      proxy.setupSourceEntries({ sourcePath: HOME_PATH, entries: [] });

      const result = await fsCpAdapter({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        excludeName: null,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopiedPairs()).toStrictEqual([]);
    });
  });

  describe('the excluded entry', () => {
    it('VALID: {excludeName: ".siegelense-snapshots"} => that child is never copied, the others are', async () => {
      const proxy = fsCpAdapterProxy();
      proxy.succeeds({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        entries: ['guilds', '.siegelense-snapshots', 'claude-queue'],
      });

      await fsCpAdapter({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        excludeName: '.siegelense-snapshots',
      });

      expect(proxy.getCopiedPairs()).toStrictEqual([
        [
          '/tmp/dm-siege-inst_7f3a9c21/guilds',
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1/guilds',
        ],
        [
          '/tmp/dm-siege-inst_7f3a9c21/claude-queue',
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1/claude-queue',
        ],
      ]);
    });

    it('EDGE: {a sibling whose name starts with the excluded one} => is still copied', async () => {
      const proxy = fsCpAdapterProxy();
      proxy.succeeds({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        entries: ['.siegelense-snapshots', '.siegelense-snapshots-old'],
      });

      await fsCpAdapter({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        excludeName: '.siegelense-snapshots',
      });

      expect(proxy.getCopiedPairs()).toStrictEqual([
        [
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots-old',
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1/.siegelense-snapshots-old',
        ],
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {a child copy fails} => propagates the underlying error', async () => {
      const proxy = fsCpAdapterProxy();
      proxy.throws({
        sourcePath: HOME_PATH,
        destinationPath: PAYLOAD_PATH,
        entries: ['guilds'],
        error: new Error('ENOSPC: no space left on device'),
      });

      await expect(
        fsCpAdapter({
          sourcePath: HOME_PATH,
          destinationPath: PAYLOAD_PATH,
          excludeName: null,
        }),
      ).rejects.toThrow(/ENOSPC/u);
    });
  });
});

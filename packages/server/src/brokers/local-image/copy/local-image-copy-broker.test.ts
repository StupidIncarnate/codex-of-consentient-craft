import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { LocalImagePathMatchStub } from '../../../contracts/local-image-path-match/local-image-path-match.stub';

import { localImageCopyBroker } from './local-image-copy-broker';
import { localImageCopyBrokerProxy } from './local-image-copy-broker.proxy';

const imagesDirPath = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster/guild-1/quest-1/images',
});

describe('localImageCopyBroker', () => {
  describe('copy-lands-in-quest-images', () => {
    it('VALID: {one match ending .jpeg, a staged uuid, a read resolving known bytes} => writes exactly one file named after the staged uuid carrying the source extension, with byte-identical content', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.jpeg', ordinal: 1 });
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const stagedUuid = 'aaaaaaaa-1111-1111-1111-111111111111';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });

      await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect(proxy.writtenDestinations()).toStrictEqual([
        AbsoluteFilePathStub({ value: `${imagesDirPath}/${stagedUuid}.jpeg` }),
      ]);
      expect(
        proxy.writtenBytesFor({
          filePath: AbsoluteFilePathStub({ value: `${imagesDirPath}/${stagedUuid}.jpeg` }),
        }),
      ).toStrictEqual(bytes);
    });
  });

  describe('not a served image type', () => {
    it('VALID: {one match ending .svg} => the source is never read and the quest images folder gains no new file', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.svg', ordinal: 1 });
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: ['22222222-8888-4888-8888-888888888888'] });

      const result = await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect(proxy.writtenDestinations()).toStrictEqual([]);
      expect([...result.entries()]).toStrictEqual([]);
    });
  });

  describe('missing-file-writes-nothing', () => {
    it('VALID: {one match whose read rejects with ENOENT} => the quest images folder gains no new file', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/missing.png', ordinal: 1 });
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: ['bbbbbbbb-2222-2222-2222-222222222222'] });
      proxy.sourceReadFails({
        filePath: match.path,
        error: new Error('ENOENT: no such file or directory'),
      });

      await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect(proxy.writtenDestinations()).toStrictEqual([]);
    });
  });

  describe('file-missing', () => {
    it('VALID: {two matches, one read rejects and one read resolves} => the returned map holds only the successful match', async () => {
      const badMatch = LocalImagePathMatchStub({ path: '/home/user/missing.png', ordinal: 1 });
      const goodMatch = LocalImagePathMatchStub({ path: '/home/user/pasted.png', ordinal: 2 });
      const bytes = new Uint8Array([5, 6, 7]);
      const badUuid = 'cccccccc-3333-3333-3333-333333333333';
      const goodUuid = 'dddddddd-4444-4444-4444-444444444444';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [badUuid, goodUuid] });
      proxy.sourceReadFails({
        filePath: badMatch.path,
        error: new Error('ENOENT: no such file or directory'),
      });
      proxy.sourceReads({ filePath: goodMatch.path, bytes });

      const result = await localImageCopyBroker({ matches: [badMatch, goodMatch], imagesDirPath });

      const goodDestination = AbsoluteFilePathStub({ value: `${imagesDirPath}/${goodUuid}.png` });

      expect([...result.entries()]).toStrictEqual([[goodMatch.ordinal, goodDestination]]);
    });
  });

  describe('file-good', () => {
    it('VALID: {one match whose read resolves known bytes} => the written path is the one destination under imagesDirPath, holding the read bytes', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.gif', ordinal: 1 });
      const bytes = new Uint8Array([8, 9]);
      const stagedUuid = 'eeeeeeee-5555-5555-5555-555555555555';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });

      await localImageCopyBroker({ matches: [match], imagesDirPath });

      const destination = AbsoluteFilePathStub({ value: `${imagesDirPath}/${stagedUuid}.gif` });

      expect(proxy.writtenDestinations()).toStrictEqual([destination]);
      expect(proxy.writtenBytesFor({ filePath: destination })).toStrictEqual(bytes);
    });
  });

  describe('copy-ok', () => {
    it("VALID: {one match read and written successfully} => the returned map holds exactly that match's ordinal mapped to its destination", async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.webp', ordinal: 3 });
      const bytes = new Uint8Array([10]);
      const stagedUuid = 'ffffffff-6666-6666-6666-666666666666';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });

      const result = await localImageCopyBroker({ matches: [match], imagesDirPath });

      const destination = AbsoluteFilePathStub({ value: `${imagesDirPath}/${stagedUuid}.webp` });

      expect([...result.entries()]).toStrictEqual([[match.ordinal, destination]]);
    });
  });

  describe('copy-failed', () => {
    it('VALID: {one match whose read resolves but whose write rejects} => the returned map holds no entry for that match', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.png', ordinal: 4 });
      const bytes = new Uint8Array([11, 12]);
      const stagedUuid = '11111111-7777-7777-7777-777777777777';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });
      const destination = AbsoluteFilePathStub({ value: `${imagesDirPath}/${stagedUuid}.png` });
      proxy.destinationWriteFails({
        filePath: destination,
        error: new Error('EACCES: permission denied'),
      });

      const result = await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect([...result.entries()]).toStrictEqual([]);
    });
  });
});

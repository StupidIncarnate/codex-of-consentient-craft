
import { LocalImagePathMatchStub } from '../../../contracts/local-image-path-match/local-image-path-match.stub';

import { localImageCopyBroker } from './local-image-copy-broker';
import { localImageCopyBrokerProxy } from './local-image-copy-broker.proxy';

const imagesDirPath = '/repo/.dungeonmaster/guild-1/quest-1/images';

describe('localImageCopyBroker', () => {
  describe('copy-lands-in-quest-images', () => {
    it('VALID: {one match ending .jpeg, a staged uuid, a read resolving known bytes} => writes exactly one file named after the staged uuid carrying the source extension, with byte-identical content', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.jpeg', ordinal: 1 });
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const stagedUuid = '45ccae5e-c8bd-3883-8d53-8ed4bf696af3';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });

      await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect(proxy.writtenDestinations()).toStrictEqual([
        `${imagesDirPath}/${stagedUuid}.jpeg`,
      ]);
      expect(
        proxy.writtenBytesFor({
          filePath: `${imagesDirPath}/${stagedUuid}.jpeg`,
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
      proxy.stageCopyIds({ ids: ['016612e6-8f4a-726a-802b-10c043690d99'] });
      proxy.sourceReadFails({ filePath: match.path });

      await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect(proxy.writtenDestinations()).toStrictEqual([]);
    });
  });

  describe('file-missing', () => {
    it('VALID: {two matches, one read rejects and one read resolves} => the returned map holds only the successful match', async () => {
      const badMatch = LocalImagePathMatchStub({ path: '/home/user/missing.png', ordinal: 1 });
      const goodMatch = LocalImagePathMatchStub({ path: '/home/user/pasted.png', ordinal: 2 });
      const bytes = new Uint8Array([5, 6, 7]);
      const badUuid = '4a83d5db-6d50-1058-bb3a-b7a4a87599ba';
      const goodUuid = '5858f7d1-cf11-5633-a358-b63524fb50c4';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [badUuid, goodUuid] });
      proxy.sourceReadFails({ filePath: badMatch.path });
      proxy.sourceReads({ filePath: goodMatch.path, bytes });

      const result = await localImageCopyBroker({ matches: [badMatch, goodMatch], imagesDirPath });

      const goodDestination = `${imagesDirPath}/${goodUuid}.png`;

      expect([...result.entries()]).toStrictEqual([[goodMatch.ordinal, goodDestination]]);
    });
  });

  describe('file-good', () => {
    it('VALID: {one match whose read resolves known bytes} => the written path is the one destination under imagesDirPath, holding the read bytes', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.gif', ordinal: 1 });
      const bytes = new Uint8Array([8, 9]);
      const stagedUuid = '49df2c11-269e-6593-b3bf-b74bda3a6170';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });

      await localImageCopyBroker({ matches: [match], imagesDirPath });

      const destination = `${imagesDirPath}/${stagedUuid}.gif`;

      expect(proxy.writtenDestinations()).toStrictEqual([destination]);
      expect(proxy.writtenBytesFor({ filePath: destination })).toStrictEqual(bytes);
    });
  });

  describe('copy-ok', () => {
    it("VALID: {one match read and written successfully} => the returned map holds exactly that match's ordinal mapped to its destination", async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.webp', ordinal: 3 });
      const bytes = new Uint8Array([10]);
      const stagedUuid = 'e14b252b-55bc-8cc7-a689-70a291329d68';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });

      const result = await localImageCopyBroker({ matches: [match], imagesDirPath });

      const destination = `${imagesDirPath}/${stagedUuid}.webp`;

      expect([...result.entries()]).toStrictEqual([[match.ordinal, destination]]);
    });
  });

  describe('copy-failed', () => {
    it('VALID: {one match whose read resolves but whose write rejects} => the returned map holds no entry for that match', async () => {
      const match = LocalImagePathMatchStub({ path: '/home/user/pasted.png', ordinal: 4 });
      const bytes = new Uint8Array([11, 12]);
      const stagedUuid = '5cb43fa2-6d67-3565-ab1e-ef2a92e363bb';
      const proxy = localImageCopyBrokerProxy();
      proxy.stageCopyIds({ ids: [stagedUuid] });
      proxy.sourceReads({ filePath: match.path, bytes });
      const destination = `${imagesDirPath}/${stagedUuid}.png`;
      proxy.destinationWriteFails({ filePath: destination });

      const result = await localImageCopyBroker({ matches: [match], imagesDirPath });

      expect([...result.entries()]).toStrictEqual([]);
      expect(proxy.stderrText()).toBe(
        `[local-image-copy-broker] failed to write ${destination}: Error: EACCES: op '${destination}'\n`,
      );
    });
  });
});

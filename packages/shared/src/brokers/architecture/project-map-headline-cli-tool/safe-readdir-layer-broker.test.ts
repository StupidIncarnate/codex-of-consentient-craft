import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

type Dirent = ReturnType<typeof safeReaddirLayerBroker>[0];

const DIR_PATH = AbsoluteFilePathStub({ value: '/repo/packages/ward/src/startup' });

const makeDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

describe('safeReaddirLayerBroker', () => {
  describe('directory exists', () => {
    it('VALID: {existing dir with files} => returns the directory entries', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const entries = [makeDirent({ name: 'start-ward.ts' })];
      proxy.returns({ entries });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result.map((e) => e.name)).toStrictEqual(['start-ward.ts']);
    });

    it('VALID: {existing dir empty} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.returns({ entries: [] });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory does not exist', () => {
    it('ERROR: {readdir throws} => returns empty array instead of throwing', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });
});

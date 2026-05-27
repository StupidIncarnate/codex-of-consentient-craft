import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { TsconfigSyncPairStub } from '../../../contracts/tsconfig-sync-pair/tsconfig-sync-pair.stub';
import { tsconfigPairWriteLayerBroker } from './tsconfig-pair-write-layer-broker';
import { tsconfigPairWriteLayerBrokerProxy } from './tsconfig-pair-write-layer-broker.proxy';

describe('tsconfigPairWriteLayerBroker()', () => {
  describe('writes tsconfig file', () => {
    it('VALID: {pair with refs, ensureComposite: true} => writes updated tsconfig and returns path', async () => {
      const proxy = tsconfigPairWriteLayerBrokerProxy();
      const tsconfigPath = AbsoluteFilePathStub({ value: '/repo/packages/hooks/tsconfig.json' });
      const pair = TsconfigSyncPairStub({
        tsconfigPath,
        currentData: { compilerOptions: { composite: true }, references: [] },
        expectedRefs: [{ path: '../shared' }],
        ensureComposite: true,
      });

      const result = await tsconfigPairWriteLayerBroker({ pair });

      expect(result).toBe('/repo/packages/hooks/tsconfig.json');

      const writes = proxy.captureWrites();

      expect(writes).toStrictEqual([
        {
          path: '/repo/packages/hooks/tsconfig.json',
          content: `${JSON.stringify({ compilerOptions: { composite: true }, references: [{ path: '../shared' }] }, null, 2)}\n`,
        },
      ]);
    });

    it('VALID: {pair with ensureComposite: false} => writes references only without composite', async () => {
      const proxy = tsconfigPairWriteLayerBrokerProxy();
      const tsconfigPath = AbsoluteFilePathStub({ value: '/repo/tsconfig.json' });
      const pair = TsconfigSyncPairStub({
        tsconfigPath,
        currentData: {},
        expectedRefs: [{ path: 'packages/shared' }, { path: 'packages/hooks' }],
        ensureComposite: false,
      });

      const result = await tsconfigPairWriteLayerBroker({ pair });

      expect(result).toBe('/repo/tsconfig.json');

      const writes = proxy.captureWrites();

      expect(writes).toStrictEqual([
        {
          path: '/repo/tsconfig.json',
          content: `${JSON.stringify({ references: [{ path: 'packages/shared' }, { path: 'packages/hooks' }] }, null, 2)}\n`,
        },
      ]);
    });
  });
});

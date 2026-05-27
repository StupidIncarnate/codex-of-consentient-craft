import { tsconfigPairWriteLayerBrokerProxy } from './tsconfig-pair-write-layer-broker.proxy';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';
import { workspaceInputBuildLayerBrokerProxy } from './workspace-input-build-layer-broker.proxy';

export const projectReferencesSyncBrokerProxy = (): {
  setupWorkspace: (params: {
    tsconfigJson: string | null;
    packageJson: string | null;
    pairTsconfigJson?: string;
  }) => void;
  setupRootTsconfig: (params: { tsconfigJson: string | null }) => void;
  flushPairReads: () => void;
  captureWrites: () => readonly { path: unknown; content: unknown }[];
} => {
  const buildProxy = workspaceInputBuildLayerBrokerProxy();
  const tsconfigProxy = readTsconfigSafeLayerBrokerProxy();
  const writeProxy = tsconfigPairWriteLayerBrokerProxy();
  const pendingPairReads: Parameters<typeof tsconfigProxy.returns>[] = [];

  return {
    /**
     * Primes the I/O for one workspace folder.
     * Only queues the eligibility-scan tsconfig+pkg reads immediately.
     * Pair-building reads are deferred — call flushPairReads() after all setupWorkspace() calls.
     *
     * tsconfigJson: content for the eligibility-scan read (null → file missing → ineligible)
     * packageJson:  content for the pkg.json read (null → file missing)
     * pairTsconfigJson: override for the pair-building tsconfig read.
     *   When omitted and tsconfigJson is not null, the same tsconfigJson is used.
     *   When tsconfigJson is null the workspace is ineligible so no pair read fires.
     */
    setupWorkspace: ({
      tsconfigJson,
      packageJson,
      pairTsconfigJson,
    }: {
      tsconfigJson: string | null;
      packageJson: string | null;
      pairTsconfigJson?: string;
    }): void => {
      buildProxy.setupWorkspace({ tsconfigJson, packageJson });
      if (tsconfigJson !== null) {
        pendingPairReads.push([{ content: pairTsconfigJson ?? tsconfigJson }]);
      }
    },

    /**
     * Queues the pair-building tsconfig reads AFTER all eligibility reads.
     * Must be called BEFORE the root tsconfig setup.
     */
    flushPairReads: (): void => {
      for (const args of pendingPairReads) {
        tsconfigProxy.returns(...args);
      }
      pendingPairReads.length = 0;
    },

    setupRootTsconfig: ({ tsconfigJson }: { tsconfigJson: string | null }): void => {
      if (tsconfigJson === null) {
        tsconfigProxy.throws({ error: new Error('ENOENT') });
      } else {
        tsconfigProxy.returns({ content: tsconfigJson });
      }
    },

    captureWrites: (): readonly { path: unknown; content: unknown }[] => writeProxy.captureWrites(),
  };
};

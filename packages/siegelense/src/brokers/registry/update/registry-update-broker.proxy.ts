import { registryReadBrokerProxy } from '../read/registry-read-broker.proxy';
import { registryWriteBrokerProxy } from '../write/registry-write-broker.proxy';
import { registryLockAcquireBrokerProxy } from '../lock-acquire/registry-lock-acquire-broker.proxy';
import { registryLockReleaseBrokerProxy } from '../lock-release/registry-lock-release-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

type EpochMs = ReturnType<typeof EpochMsStub>;

export const registryUpdateBrokerProxy = (): {
  lockPath: ReturnType<typeof registryLockAcquireBrokerProxy>['lockPath'];
  setupCurrentRegistry: (params: { json: string }) => void;
  setupCurrentRegistryForThrowingMutate: (params: { json: string }) => void;
  setupCurrentRegistryWithStaleLock: (params: { json: string; nowMs: EpochMs }) => void;
  setupLockHeldFreshByAnotherProcess: () => void;
  getWrittenContent: () => unknown;
  getLockWriteFlag: () => unknown;
  getLockDeletedPaths: () => unknown[];
} => {
  // registryUpdateBroker acquires the lock, reads, mutates, writes, then releases — the four
  // child proxies are composed here so a test only ever calls this one semantic method, never
  // navigating the lock/read/write proxies directly.
  const lockAcquireProxy = registryLockAcquireBrokerProxy();
  const lockReleaseProxy = registryLockReleaseBrokerProxy();
  const readProxy = registryReadBrokerProxy();
  const writeProxy = registryWriteBrokerProxy();

  // pathJoinAdapterProxy's staged-resolution queue is shared and call-order-scoped across every
  // composed proxy in a test, so each child proxy's setup call below happens in exactly the order
  // its real broker call happens: acquire, then read, then write, then release last.
  return {
    lockPath: lockAcquireProxy.lockPath,

    setupCurrentRegistry: ({ json }: { json: string }): void => {
      lockAcquireProxy.setupNow({ nowMs: EpochMsStub() });
      lockAcquireProxy.setupAvailable();
      readProxy.setupPresentRegistry({ content: json });
      writeProxy.setupWriteSuccess();
      lockReleaseProxy.setupReleaseSucceeds();
    },

    // `mutate` throws before `registryWriteBroker` is ever reached, so — unlike
    // `setupCurrentRegistry` — this stages no write path resolution at all: a broker that still
    // called write would hit an unconfigured mock and fail loudly, which is exactly what proves
    // it never got there. Release is staged immediately after read, since that is the next real
    // call once the write step is skipped.
    setupCurrentRegistryForThrowingMutate: ({ json }: { json: string }): void => {
      lockAcquireProxy.setupNow({ nowMs: EpochMsStub() });
      lockAcquireProxy.setupAvailable();
      readProxy.setupPresentRegistry({ content: json });
      lockReleaseProxy.setupReleaseSucceeds();
    },

    setupCurrentRegistryWithStaleLock: ({
      json,
      nowMs,
    }: {
      json: string;
      nowMs: EpochMs;
    }): void => {
      lockAcquireProxy.setupStaleHeldByAnother({ nowMs });
      lockAcquireProxy.setupNow({ nowMs });
      lockAcquireProxy.setupAvailable();
      readProxy.setupPresentRegistry({ content: json });
      writeProxy.setupWriteSuccess();
      lockReleaseProxy.setupReleaseSucceeds();
    },

    setupLockHeldFreshByAnotherProcess: (): void => {
      // No read, write or release setup — a broker that still reached any of those would hit an
      // unconfigured mock and fail loudly, which is exactly what proves it never got there.
      lockAcquireProxy.setupFreshHeldByAnotherPastCeiling();
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),

    getLockWriteFlag: (): unknown => lockAcquireProxy.getLastWriteFlag(),

    getLockDeletedPaths: (): unknown[] => lockReleaseProxy.getDeletedPaths(),
  };
};

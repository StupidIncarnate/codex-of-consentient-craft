import type { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import * as healthSnapshotBrokerModule from '../../../brokers/health/snapshot/health-snapshot-broker';
import { healthSnapshotBrokerProxy } from '../../../brokers/health/snapshot/health-snapshot-broker.proxy';
import { HealthCheckResponder } from './health-check-responder';

type HealthSnapshot = ReturnType<typeof HealthSnapshotStub>;

export const HealthCheckResponderProxy = (): {
  setupSnapshot: (params: { snapshot: HealthSnapshot }) => void;
  setupFailure: (params: { message: string }) => void;
  setupNonErrorFailure: () => void;
  clearEnv: () => void;
  callResponder: typeof HealthCheckResponder;
} => {
  const brokerProxy = healthSnapshotBrokerProxy();

  return {
    setupSnapshot: ({ snapshot }: { snapshot: HealthSnapshot }): void => {
      brokerProxy.setupSnapshot({
        uptimeSeconds: snapshot.uptimeSeconds,
        version: snapshot.version,
        port: snapshot.port,
        home: snapshot.home,
        orchestrationMode: snapshot.orchestrationMode,
        timestamp: snapshot.timestamp,
      });
    },
    setupFailure: ({ message }: { message: string }): void => {
      brokerProxy.setupModeFailure({ error: new Error(message) });
    },
    // registerMock's own throws()/rejects() always coerce a non-Error reason into `new
    // Error(String(reason))` (see @dungeonmaster/testing's mockStagingCreateTransformer), so a
    // genuinely non-Error rejection can only be produced by replacing the call itself via
    // `implement`. healthSnapshotBroker is a broker, which a responder proxy may import directly
    // (see architecture layer rules), so spying on it here — the same technique
    // use-guilds-binding.proxy.ts uses on guildListBroker — stays inside the allowed import
    // boundary instead of reaching into the orchestrator adapter beneath it.
    setupNonErrorFailure: (): void => {
      const brokerHandle = registerSpyOn({
        object: healthSnapshotBrokerModule,
        method: 'healthSnapshotBroker',
      });
      // TypeScript's `Error` interface is structural (name/message/optional stack), so a plain
      // object shaped like one satisfies the type checker while staying a plain object at
      // runtime — `instanceof Error` is nominal and reports false for it. That gap is exactly
      // what this test case needs: a rejection reason the type checker accepts as Error-shaped
      // (so @typescript-eslint/prefer-promise-reject-errors has nothing to flag) but that
      // HealthCheckResponder's `error instanceof Error` check genuinely fails for at runtime —
      // mirroring a deserialized error that crossed a process boundary and lost its prototype.
      const nonErrorReason: Error = { name: 'NonError', message: 'non-error-rejection' };
      brokerHandle.calledWith([]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(nonErrorReason);
      });
    },
    clearEnv: (): void => {
      brokerProxy.clearEnv();
    },
    callResponder: HealthCheckResponder,
  };
};

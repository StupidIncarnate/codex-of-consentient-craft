/**
 * PURPOSE: Hooks MSW server lifecycle events to capture HTTP traffic for test diagnostics
 *
 * USAGE:
 * const recorder = networkRecordCaptureBroker({ server });
 * recorder.start();
 * // ... run tests that make HTTP requests ...
 * await recorder.flush();
 * const entries = recorder.getEntries();
 * recorder.stop();
 */

import { stderr } from '#gateway/node/process';
import type { SetupServer } from '#gateway/npm/msw__node';
import { networkLogEntryContract } from '../../../contracts/network-log-entry/network-log-entry-contract';
import { networkLogStatics } from '../../../statics/network-log/network-log-statics';
import { mswResponseToNetworkEntryTransformer } from '../../../transformers/msw-response-to-network-entry/msw-response-to-network-entry-transformer';
import type { NetworkLogEntry } from '../../../contracts/network-log-entry/network-log-entry-contract';
import type { PendingRequest } from '../../../contracts/pending-request/pending-request-contract';
import { pendingRequestContract } from '../../../contracts/pending-request/pending-request-contract';

export const networkRecordCaptureBroker = ({
  server,
}: {
  server: SetupServer;
}): {
  start: () => void;
  stop: () => void;
  clear: () => void;
  flush: () => Promise<void>;
  getEntries: () => NetworkLogEntry[];
} => {
  const entries: NetworkLogEntry[] = [];
  const pendingRequests = new Map<string, PendingRequest>();
  const pendingBodies: Promise<void>[] = [];

  return {
    start: (): void => {
      server.events.on('request:start', ({ request, requestId }) => {
        const clonedRequest = request.clone();
        const parsedRequestId = requestId;

        pendingRequests.set(
          parsedRequestId,
          pendingRequestContract.parse({
            method: networkLogEntryContract.shape.method.parse(request.method),
            url: networkLogEntryContract.shape.url.parse(request.url),
            timestampMs: Date.now(),
          }),
        );

        pendingBodies.push(
          clonedRequest
            .text()
            .then((body) => {
              const existing = pendingRequests.get(parsedRequestId);
              if (existing && body.length > 0) {
                existing.requestBody = pendingRequestContract.shape.requestBody
                  .unwrap()
                  .parse(body.slice(0, networkLogStatics.limits.maxBodyLength));
              }
            })
            .catch((error: unknown) => {
              stderr.write(`[network-record] request body read failed: ${String(error)}\n`);
            }),
        );
      });

      server.events.on('response:mocked', ({ response, requestId }) => {
        const parsedRequestId = requestId;
        const pending = pendingRequests.get(parsedRequestId);
        if (!pending) {
          return;
        }

        const durationMs = networkLogEntryContract.shape.durationMs
          .unwrap()
          .parse(Date.now() - pending.timestampMs);

        pendingBodies.push(
          mswResponseToNetworkEntryTransformer({
            entry: networkLogEntryContract.parse({
              method: pending.method,
              url: pending.url,
              status: networkLogEntryContract.shape.status.unwrap().parse(response.status),
              durationMs,
              requestBody: pending.requestBody,
              source: 'mock',
            }),
            response,
          }).then((entry) => {
            entries.push(entry);
            pendingRequests.delete(parsedRequestId);
          }),
        );
      });

      server.events.on('response:bypass', ({ response, requestId }) => {
        const parsedRequestId = requestId;
        const pending = pendingRequests.get(parsedRequestId);
        if (!pending) {
          return;
        }

        const durationMs = networkLogEntryContract.shape.durationMs
          .unwrap()
          .parse(Date.now() - pending.timestampMs);

        pendingBodies.push(
          mswResponseToNetworkEntryTransformer({
            entry: networkLogEntryContract.parse({
              method: pending.method,
              url: pending.url,
              status: networkLogEntryContract.shape.status.unwrap().parse(response.status),
              durationMs,
              requestBody: pending.requestBody,
              source: 'bypass',
            }),
            response,
          }).then((entry) => {
            entries.push(entry);
            pendingRequests.delete(parsedRequestId);
          }),
        );
      });
    },

    stop: (): void => {
      server.events.removeAllListeners('request:start');
      server.events.removeAllListeners('response:mocked');
      server.events.removeAllListeners('response:bypass');
    },

    clear: (): void => {
      entries.length = 0;
      pendingRequests.clear();
      pendingBodies.length = 0;
    },

    flush: async (): Promise<void> => {
      const toAwait = [...pendingBodies];
      pendingBodies.length = 0;
      await Promise.all(toAwait);
    },

    getEntries: (): NetworkLogEntry[] => [...entries],
  };
};

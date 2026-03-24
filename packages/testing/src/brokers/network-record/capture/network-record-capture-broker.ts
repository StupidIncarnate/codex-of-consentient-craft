/**
 * PURPOSE: Hooks MSW server lifecycle events to capture HTTP traffic for test diagnostics
 *
 * USAGE:
 * const recorder = networkRecordCaptureBroker();
 * recorder.start();
 * // ... run tests that make HTTP requests ...
 * await recorder.flush();
 * const entries = recorder.getEntries();
 * recorder.stop();
 */

import { mswServerAdapter } from '../../../adapters/msw/server/msw-server-adapter';
import { mswRequestIdContract } from '../../../contracts/msw-request-id/msw-request-id-contract';
import { epochTimestampContract } from '../../../contracts/epoch-timestamp/epoch-timestamp-contract';
import { networkLogEntryContract } from '../../../contracts/network-log-entry/network-log-entry-contract';
import { networkLogStatics } from '../../../statics/network-log/network-log-statics';
import { mswResponseToNetworkEntryTransformer } from '../../../transformers/msw-response-to-network-entry/msw-response-to-network-entry-transformer';
import type { NetworkLogEntry } from '../../../contracts/network-log-entry/network-log-entry-contract';
import type { MswRequestId } from '../../../contracts/msw-request-id/msw-request-id-contract';
import type { PendingRequest } from '../../../contracts/pending-request/pending-request-contract';

export const networkRecordCaptureBroker = (): {
  start: () => void;
  stop: () => void;
  clear: () => void;
  flush: () => Promise<void>;
  getEntries: () => NetworkLogEntry[];
} => {
  const entries: NetworkLogEntry[] = [];
  const pendingRequests = new Map<MswRequestId, PendingRequest>();
  const pendingBodies: Promise<void>[] = [];

  const server = mswServerAdapter();

  return {
    start: (): void => {
      server.events.on('request:start', ({ request, requestId }) => {
        const clonedRequest = request.clone();
        const parsedRequestId = mswRequestIdContract.parse(requestId);

        pendingRequests.set(parsedRequestId, {
          method: networkLogEntryContract.shape.method.parse(request.method),
          url: networkLogEntryContract.shape.url.parse(request.url),
          timestampMs: epochTimestampContract.parse(Date.now()),
        });

        pendingBodies.push(
          clonedRequest
            .text()
            .then((body) => {
              const existing = pendingRequests.get(parsedRequestId);
              if (existing && body.length > 0) {
                existing.requestBody = networkLogEntryContract.shape.requestBody
                  .unwrap()
                  .parse(body.slice(0, networkLogStatics.limits.maxBodyLength));
              }
            })
            .catch(() => {
              // Body read failure is non-fatal
            }),
        );
      });

      server.events.on('response:mocked', ({ response, requestId }) => {
        const parsedRequestId = mswRequestIdContract.parse(requestId);
        const pending = pendingRequests.get(parsedRequestId);
        if (!pending) {
          return;
        }

        const durationMs = networkLogEntryContract.shape.durationMs
          .unwrap()
          .parse(Date.now() - pending.timestampMs);

        pendingBodies.push(
          mswResponseToNetworkEntryTransformer({
            method: pending.method,
            url: pending.url,
            status: networkLogEntryContract.shape.status.unwrap().parse(response.status),
            durationMs,
            source: 'mock',
            response,
            requestBody: pending.requestBody,
          }).then((entry) => {
            entries.push(entry);
            pendingRequests.delete(parsedRequestId);
          }),
        );
      });

      server.events.on('response:bypass', ({ response, requestId }) => {
        const parsedRequestId = mswRequestIdContract.parse(requestId);
        const pending = pendingRequests.get(parsedRequestId);
        if (!pending) {
          return;
        }

        const durationMs = networkLogEntryContract.shape.durationMs
          .unwrap()
          .parse(Date.now() - pending.timestampMs);

        pendingBodies.push(
          mswResponseToNetworkEntryTransformer({
            method: pending.method,
            url: pending.url,
            status: networkLogEntryContract.shape.status.unwrap().parse(response.status),
            durationMs,
            source: 'bypass',
            response,
            requestBody: pending.requestBody,
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

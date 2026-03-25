/**
 * PURPOSE: Captures browser network traffic for test diagnostics via Playwright event adapters
 *
 * USAGE:
 * const recorder = networkRecordPlaywrightBroker({ page });
 * // ... run browser interactions ...
 * await recorder.dump({ testInfo });
 * const entries = recorder.getEntries();
 * const wsEntries = recorder.getWsEntries();
 */

import { playwrightPageEventsAdapter } from '../../../adapters/playwright/page-events/playwright-page-events-adapter';
import { playwrightTestInfoAttachAdapter } from '../../../adapters/playwright/test-info-attach/playwright-test-info-attach-adapter';
import { networkLogEntryContract } from '../../../contracts/network-log-entry/network-log-entry-contract';
import { wsLogEntryContract } from '../../../contracts/ws-log-entry/ws-log-entry-contract';
import { epochTimestampContract } from '../../../contracts/epoch-timestamp/epoch-timestamp-contract';
import { networkLogStatics } from '../../../statics/network-log/network-log-statics';
import { networkLogFormatTransformer } from '../../../transformers/network-log-format/network-log-format-transformer';
import type { NetworkLogEntry } from '../../../contracts/network-log-entry/network-log-entry-contract';
import type { WsLogEntry } from '../../../contracts/ws-log-entry/ws-log-entry-contract';
import type { EpochTimestamp } from '../../../contracts/epoch-timestamp/epoch-timestamp-contract';

type PageParam = Parameters<typeof playwrightPageEventsAdapter>[0]['page'];
type TestInfoParam = Parameters<typeof playwrightTestInfoAttachAdapter>[0]['testInfo'];
type RequestIdentity = Parameters<
  Parameters<typeof playwrightPageEventsAdapter>[0]['onRequest']
>[0]['requestIdentity'];

export const networkRecordPlaywrightBroker = ({
  page,
}: {
  page: PageParam;
}): {
  dump: (args: { testInfo: TestInfoParam }) => Promise<void>;
  getEntries: () => NetworkLogEntry[];
  getWsEntries: () => WsLogEntry[];
} => {
  const entries: NetworkLogEntry[] = [];
  const wsEntries: WsLogEntry[] = [];
  const requestTimestamps = new Map<RequestIdentity, EpochTimestamp>();
  const testStartMs = epochTimestampContract.parse(Date.now());

  playwrightPageEventsAdapter({
    page,
    onRequest: ({ url, method, postData, requestIdentity }) => {
      if (!url.includes(networkLogStatics.filters.apiPathFilter)) {
        return;
      }

      requestTimestamps.set(requestIdentity, epochTimestampContract.parse(Date.now()));

      const truncatedBody = postData
        ? postData.slice(0, networkLogStatics.limits.maxBodyLength)
        : undefined;

      entries.push(
        networkLogEntryContract.parse({
          method,
          url,
          requestBody: truncatedBody,
          source: 'browser',
        }),
      );
    },

    onResponse: ({ url, method, status, hasCapturableBody, text, requestIdentity }) => {
      if (!url.includes(networkLogStatics.filters.apiPathFilter)) {
        return;
      }

      const startTs = requestTimestamps.get(requestIdentity);
      const durationMs = startTs === undefined ? undefined : Date.now() - startTs;

      const matchIndex = entries.findIndex(
        (entry) => entry.url === url && entry.method === method && entry.status === undefined,
      );

      if (matchIndex >= 0) {
        const existing = entries[matchIndex];
        if (existing) {
          entries[matchIndex] = networkLogEntryContract.parse({
            method: existing.method,
            url: existing.url,
            status,
            durationMs,
            requestBody: existing.requestBody,
            source: 'browser',
          });

          if (hasCapturableBody) {
            text()
              .then((body) => {
                const current = entries[matchIndex];
                if (current && body) {
                  entries[matchIndex] = networkLogEntryContract.parse({
                    ...current,
                    responseBody: body.slice(0, networkLogStatics.limits.maxBodyLength),
                  });
                }
              })
              .catch(() => {
                // Response body read failure is non-fatal
              });
          }
        }
      }
    },

    onRequestFailed: ({ url, method, errorText }) => {
      if (!url.includes(networkLogStatics.filters.apiPathFilter)) {
        return;
      }

      const matchIndex = entries.findIndex(
        (entry) => entry.url === url && entry.method === method && entry.status === undefined,
      );

      if (matchIndex >= 0) {
        const existing = entries[matchIndex];
        if (existing) {
          entries[matchIndex] = networkLogEntryContract.parse({
            method: existing.method,
            url: existing.url,
            requestBody: existing.requestBody,
            error: errorText,
            source: 'browser',
          });
        }
      }
    },

    onWebSocketFrame: ({ direction, payload }) => {
      const elapsedMs = Date.now() - testStartMs;
      wsEntries.push(
        wsLogEntryContract.parse({
          direction,
          data:
            typeof payload === 'string'
              ? payload.slice(0, networkLogStatics.limits.maxBodyLength)
              : '<binary>',
          elapsedMs,
        }),
      );
    },
  });

  return {
    dump: async ({ testInfo }: { testInfo: TestInfoParam }): Promise<void> => {
      if (testInfo.status === undefined || testInfo.status === testInfo.expectedStatus) {
        return;
      }

      if (entries.length === 0 && wsEntries.length === 0) {
        return;
      }

      const formatted = networkLogFormatTransformer({ entries, wsEntries });

      const logContent = [
        networkLogStatics.delimiters.start,
        formatted,
        networkLogStatics.delimiters.end,
      ].join('\n');

      // Write to stderr so ward can extract it from rawOutput (attachment content gets truncated by Playwright's line reporter)
      process.stderr.write(`\n${logContent}\n`);

      await playwrightTestInfoAttachAdapter({
        testInfo,
        name: 'network-log',
        body: logContent,
      });
    },

    getEntries: (): NetworkLogEntry[] => [...entries],

    getWsEntries: (): WsLogEntry[] => [...wsEntries],
  };
};

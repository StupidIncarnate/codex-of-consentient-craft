/**
 * PURPOSE: Wraps Node's global fetch API for PATCH requests with a JSON body
 *
 * USAGE:
 * await fetchPatchAdapter({ url: 'http://dungeonmaster.localhost:3737/api/quests/abc-123', body: { designDecisions: [] } });
 * // Sends JSON PATCH, throws Error with URL, status, and body text on non-OK responses.
 */

import { adapterResultContract, type AdapterResult } from '@dungeonmaster/shared/contracts';

export const fetchPatchAdapter = async ({
  url,
  body,
}: {
  url: string;
  body: unknown;
}): Promise<AdapterResult> => {
  const response = await globalThis.fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`PATCH ${url} failed with status ${String(response.status)}: ${bodyText}`);
  }

  return adapterResultContract.parse({ success: true });
};

import type { SmoketestCaseResult, SmoketestRunId } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const toolingRunSmoketestBrokerProxy = (): {
  setupSuccess: (params: {
    runId: SmoketestRunId;
    results: readonly SmoketestCaseResult[];
  }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.toolingSmoketestRun,
  });

  return {
    setupSuccess: ({ runId, results }) => {
      endpoint.resolves({ data: { runId, results } });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};

import { QuestIdStub, SmoketestSuiteStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { useSmoketestRunBinding } from './use-smoketest-run-binding';
import { useSmoketestRunBindingProxy } from './use-smoketest-run-binding.proxy';

describe('useSmoketestRunBinding', () => {
  it('VALID: {run({ suite: mcp })} => POSTs and resolves to first enqueued entry', async () => {
    const questId = QuestIdStub({ value: '11111111-2222-3333-4444-555555555555' });
    const guildSlug = UrlSlugStub({ value: 'my-guild' });
    const proxy = useSmoketestRunBindingProxy();
    proxy.setupSuccess({ enqueued: [{ questId, guildSlug }] });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useSmoketestRunBinding(),
    });

    const first = await result.current.run({ suite: SmoketestSuiteStub({ value: 'mcp' }) });

    expect(first).toStrictEqual({ questId, guildSlug });
  });

  it('EMPTY: {run({ suite: mcp }), server returns empty enqueued} => resolves to null', async () => {
    const proxy = useSmoketestRunBindingProxy();
    proxy.setupSuccess({ enqueued: [] });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useSmoketestRunBinding(),
    });

    const first = await result.current.run({ suite: SmoketestSuiteStub({ value: 'mcp' }) });

    expect(first).toBe(null);
  });
});

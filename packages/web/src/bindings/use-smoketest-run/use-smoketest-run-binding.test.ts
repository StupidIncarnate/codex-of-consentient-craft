import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { useSmoketestRunBinding } from './use-smoketest-run-binding';
import { useSmoketestRunBindingProxy } from './use-smoketest-run-binding.proxy';

describe('useSmoketestRunBinding', () => {
  it('VALID: {initial mount} => opened=false, running=false, results=[]', () => {
    useSmoketestRunBindingProxy();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useSmoketestRunBinding(),
    });

    expect({
      opened: result.current.opened,
      running: result.current.running,
      runId: result.current.runId,
      results: result.current.results,
    }).toStrictEqual({ opened: false, running: false, runId: null, results: [] });
  });
});

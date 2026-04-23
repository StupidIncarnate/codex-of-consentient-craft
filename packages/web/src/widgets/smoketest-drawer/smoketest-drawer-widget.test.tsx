import { SmoketestCaseResultStub, SmoketestRunIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { TotalCountStub } from '../../contracts/total-count/total-count.stub';
import { SmoketestDrawerWidget } from './smoketest-drawer-widget';
import { SmoketestDrawerWidgetProxy } from './smoketest-drawer-widget.proxy';

describe('SmoketestDrawerWidget', () => {
  it('VALID: {open drawer with one passing result} => renders the run id text', () => {
    SmoketestDrawerWidgetProxy();
    const runId = SmoketestRunIdStub();
    const result = SmoketestCaseResultStub({ passed: true });

    const { getByTestId } = mantineRenderAdapter({
      ui: (
        <SmoketestDrawerWidget
          opened
          onClose={(): void => undefined}
          runId={runId}
          total={null}
          currentCase={null}
          results={[result]}
          running={false}
        />
      ),
    });

    expect(getByTestId('SMOKETEST_DRAWER_RUN_ID').textContent).toBe(`runId: ${runId}`);
  });

  it('VALID: {running with current case} => renders current-case row with name', () => {
    SmoketestDrawerWidgetProxy();
    const currentResult = SmoketestCaseResultStub({ passed: true });

    const { getByTestId } = mantineRenderAdapter({
      ui: (
        <SmoketestDrawerWidget
          opened
          onClose={(): void => undefined}
          runId={null}
          total={TotalCountStub({ value: 16 })}
          currentCase={{ caseId: currentResult.caseId, name: currentResult.name }}
          results={[]}
          running
        />
      ),
    });

    expect(getByTestId('SMOKETEST_DRAWER_CURRENT_CASE').textContent).toBe(
      `Now: ${currentResult.name}`,
    );
  });

  it('VALID: {result with output} => renders the output block', () => {
    SmoketestDrawerWidgetProxy();
    const runId = SmoketestRunIdStub();
    const result = SmoketestCaseResultStub({ passed: true, output: 'line-a\nline-b' });

    const { getByTestId } = mantineRenderAdapter({
      ui: (
        <SmoketestDrawerWidget
          opened
          onClose={(): void => undefined}
          runId={runId}
          total={null}
          currentCase={null}
          results={[result]}
          running={false}
        />
      ),
    });

    expect(getByTestId(`SMOKETEST_CASE_OUTPUT_${result.caseId.toUpperCase()}`).textContent).toBe(
      'line-a\nline-b',
    );
  });
});

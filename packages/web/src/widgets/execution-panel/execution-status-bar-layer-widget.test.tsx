import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CompletedCountStub } from '../../contracts/completed-count/completed-count.stub';
import { TotalCountStub } from '../../contracts/total-count/total-count.stub';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { ExecutionStatusBarLayerWidgetProxy } from './execution-status-bar-layer-widget.proxy';

describe('ExecutionStatusBarLayerWidget', () => {
  describe('awaiting plan', () => {
    it('EMPTY: {totalCount: 0} => renders AWAITING PLAN text', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 0 })}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTIONAWAITING PLAN');
    });
  });

  describe('operations progress', () => {
    it('VALID: {completedCount: 3, totalCount: 8} => renders operations completion count', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 3 })}
            totalCount={TotalCountStub({ value: 8 })}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTION3/8 OPERATIONS');
    });

    it('VALID: {completedCount: 0, totalCount: 5} => renders zero completion', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 5 })}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTION0/5 OPERATIONS');
    });
  });

  describe('styling', () => {
    it('VALID: {any props} => renders border-bottom', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 8 })}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.style.borderBottom).toBe('1px solid rgb(61, 42, 30)');
    });
  });
});

import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CompletedCountStub } from '../../contracts/completed-count/completed-count.stub';
import { TotalCountStub } from '../../contracts/total-count/total-count.stub';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { ExecutionStatusBarLayerWidgetProxy } from './execution-status-bar-layer-widget.proxy';

describe('ExecutionStatusBarLayerWidget', () => {
  describe('planning phase', () => {
    it('VALID: {isPlanning: true} => renders PLANNING text', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 8 })}
            isPlanning={true}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');
      const barText = bar.textContent;

      expect(barText).toContain('EXECUTION');
      expect(barText).toContain('PLANNING');
    });
  });

  describe('execution phase', () => {
    it('VALID: {completedCount: 3, totalCount: 8} => renders completion count', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 3 })}
            totalCount={TotalCountStub({ value: 8 })}
            isPlanning={false}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');
      const barText = bar.textContent;

      expect(barText).toContain('EXECUTION');
      expect(barText).toContain('3/8 COMPLETE');
    });

    it('VALID: {completedCount: 0, totalCount: 5} => renders zero completion', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 5 })}
            isPlanning={false}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toContain('0/5 COMPLETE');
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
            isPlanning={false}
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.style.borderBottom).toBe('1px solid rgb(61, 42, 30)');
    });
  });
});

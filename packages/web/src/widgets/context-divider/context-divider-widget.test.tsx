import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ContextTokenCountStub } from '../../contracts/context-token-count/context-token-count.stub';
import { ContextTokenDeltaStub } from '../../contracts/context-token-delta/context-token-delta.stub';
import { ContextDividerWidget } from './context-divider-widget';
import { ContextDividerWidgetProxy } from './context-divider-widget.proxy';

describe('ContextDividerWidget', () => {
  describe('session divider', () => {
    it('VALID: {contextTokens: 25500, delta: null, source: session} => shows formatted tokens', () => {
      const proxy = ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 25500 })}
            delta={null}
            source="session"
          />
        ),
      });

      expect(proxy.isDividerVisible()).toBe(true);

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('25.5k context');
    });

    it('VALID: {contextTokens: 25500, delta: 2100, source: session} => shows delta with plus', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 25500 })}
            delta={ContextTokenDeltaStub({ value: 2100 })}
            source="session"
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('25.5k context (+2.1k)');
    });

    it('VALID: {contextTokens: 26116, delta: -3682, source: session} => shows delta with minus', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 26116 })}
            delta={ContextTokenDeltaStub({ value: -3682 })}
            source="session"
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('26.1k context (-3.7k)');
    });
  });

  describe('subagent divider', () => {
    it('VALID: {contextTokens: 10000, delta: null, source: subagent} => shows sub-agent label', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 10000 })}
            delta={null}
            source="subagent"
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('10.0k sub-agent context');
    });
  });

  describe('small token counts', () => {
    it('VALID: {contextTokens: 500, delta: null, source: session} => shows raw number', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 500 })}
            delta={null}
            source="session"
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('500 context');
    });
  });

  describe('subagent running total', () => {
    it('VALID: {subagentTotalTokens: 12000} => appends SubAgents segment', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 118800 })}
            delta={ContextTokenDeltaStub({ value: 9000 })}
            source="session"
            subagentTotalTokens={ContextTokenCountStub({ value: 12000 })}
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('118.8k context (+9.0k) · SubAgents - 12.0k');
    });

    it('VALID: {subagentTotalTokens: 0} => still appends SubAgents segment with 0', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 1000 })}
            delta={null}
            source="session"
            subagentTotalTokens={ContextTokenCountStub({ value: 0 })}
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('1.0k context · SubAgents - 0');
    });

    it('VALID: {subagentTotalTokens omitted} => SubAgents segment hidden', () => {
      ContextDividerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ContextDividerWidget
            contextTokens={ContextTokenCountStub({ value: 1000 })}
            delta={null}
            source="session"
          />
        ),
      });

      const divider = screen.getByTestId('CONTEXT_DIVIDER');

      expect(divider.textContent).toBe('1.0k context');
    });
  });
});

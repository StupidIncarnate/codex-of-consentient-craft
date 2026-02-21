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

      expect(divider.textContent).toMatch(/^25\.5k context$/u);
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

      expect(divider.textContent).toMatch(/^25\.5k context \(\+2\.1k\)$/u);
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

      expect(divider.textContent).toMatch(/^26\.1k context \(-3\.7k\)$/u);
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

      expect(divider.textContent).toMatch(/^10\.0k sub-agent context$/u);
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

      expect(divider.textContent).toMatch(/^500 context$/u);
    });
  });
});

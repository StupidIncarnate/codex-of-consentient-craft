import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { UserChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import type { InjectedPromptLayerWidgetProps } from './injected-prompt-layer-widget';
import { InjectedPromptLayerWidget } from './injected-prompt-layer-widget';
import { InjectedPromptLayerWidgetProxy } from './injected-prompt-layer-widget.proxy';

type UserEntry = InjectedPromptLayerWidgetProps['entry'];

describe('InjectedPromptLayerWidget', () => {
  describe('agent prompt section', () => {
    it('VALID: {injected prompt with ## User Request} => renders AGENT PROMPT section', () => {
      InjectedPromptLayerWidgetProxy();
      const entry = UserChatEntryStub({
        content: 'You are an agent.\n\n## User Request\n\nFix the bug',
        isInjectedPrompt: true,
      });

      mantineRenderAdapter({
        ui: (
          <InjectedPromptLayerWidget
            entry={entry as UserEntry}
            borderColor={emberDepthsThemeStatics.colors['loot-gold']}
            label="YOU"
          />
        ),
      });

      const agentSection = screen.getByTestId('AGENT_PROMPT_SECTION');

      expect(agentSection.textContent).toMatch(/AGENT PROMPT/u);
      expect(agentSection.textContent).toMatch(/You are an agent\./u);
    });

    it('VALID: {injected prompt} => renders extracted user request with YOU label', () => {
      InjectedPromptLayerWidgetProxy();
      const entry = UserChatEntryStub({
        content: 'System prompt here\n\n## User Request\n\nDo the thing',
        isInjectedPrompt: true,
      });

      mantineRenderAdapter({
        ui: (
          <InjectedPromptLayerWidget
            entry={entry as UserEntry}
            borderColor={emberDepthsThemeStatics.colors['loot-gold']}
            label="YOU"
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/YOU/u);
      expect(message.textContent).toMatch(/Do the thing/u);
    });

    it('VALID: {injected prompt without ## User Request separator} => renders full content as user request', () => {
      InjectedPromptLayerWidgetProxy();
      const entry = UserChatEntryStub({
        content: 'Just some prompt without separator',
        isInjectedPrompt: true,
      });

      mantineRenderAdapter({
        ui: (
          <InjectedPromptLayerWidget
            entry={entry as UserEntry}
            borderColor={emberDepthsThemeStatics.colors['loot-gold']}
            label="YOU"
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/Just some prompt without separator/u);
    });
  });

  describe('border styling', () => {
    it('VALID: {borderColor loot-gold} => renders loot-gold borders', () => {
      InjectedPromptLayerWidgetProxy();
      const entry = UserChatEntryStub({
        content: 'Prompt\n\n## User Request\n\nRequest',
        isInjectedPrompt: true,
      });

      mantineRenderAdapter({
        ui: (
          <InjectedPromptLayerWidget
            entry={entry as UserEntry}
            borderColor={emberDepthsThemeStatics.colors['loot-gold']}
            label="YOU"
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(251, 191, 36)');
      expect(message.style.borderRight).toBe('2px solid rgb(251, 191, 36)');
    });
  });
});

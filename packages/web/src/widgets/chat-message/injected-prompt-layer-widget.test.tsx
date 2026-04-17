import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { UserChatEntryStub } from '@dungeonmaster/shared/contracts';
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

      const sectionText = agentSection.textContent;

      expect(sectionText).toBe('AGENT PROMPTYou are an agent.');
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

      const messageText = message.textContent;

      expect(messageText).toBe('AGENT PROMPTSystem prompt hereYOUDo the thing');
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

      expect(message.textContent).toBe(
        'AGENT PROMPTJust some prompt without separatorYOUJust some prompt without separator',
      );
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

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(251, 191, 36)',

        '2px solid rgb(251, 191, 36)',
      ]);
    });
  });
});

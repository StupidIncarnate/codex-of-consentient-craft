import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestLoadErrorWidget } from './quest-load-error-widget';
import { QuestLoadErrorWidgetProxy } from './quest-load-error-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'b5b88627-1c8c-4c08-b57d-2bd363ce8c38' });
const PARSE_REASON =
  'Failed to parse quest file at /home/dm/guilds/g1/quests/b5b88627/quest.json: comments.0.createdAt: Invalid datetime' as never;

describe('QuestLoadErrorWidget', () => {
  describe('rendering', () => {
    it('ERROR: {questId, a field-level parse reason} => names the quest file and shows the reason verbatim', () => {
      const proxy = QuestLoadErrorWidgetProxy();

      mantineRenderAdapter({
        ui: <QuestLoadErrorWidget questId={QUEST_ID} reason={PARSE_REASON} />,
      });

      expect(proxy.hasError()).toBe(true);
      expect(proxy.getFileText()).toBe('b5b88627-1c8c-4c08-b57d-2bd363ce8c38/quest.json');
      // Verbatim: the rejected field is the only actionable part, so nothing may be summarised away.
      expect(proxy.getReasonText()).toBe(
        'Failed to parse quest file at /home/dm/guilds/g1/quests/b5b88627/quest.json: comments.0.createdAt: Invalid datetime',
      );
    });

    it('VALID: {a reason containing a long unbroken path} => the reason row can wrap', () => {
      const proxy = QuestLoadErrorWidgetProxy();

      mantineRenderAdapter({
        ui: <QuestLoadErrorWidget questId={QUEST_ID} reason={PARSE_REASON} />,
      });

      expect(proxy.getReasonOverflowWrap()).toBe('anywhere');
    });
  });
});

import { SkippedQuestFileStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { UnreadableQuestRowLayerWidget } from './unreadable-quest-row-layer-widget';
import { UnreadableQuestRowLayerWidgetProxy } from './unreadable-quest-row-layer-widget.proxy';

describe('UnreadableQuestRowLayerWidget', () => {
  describe('rendering', () => {
    it('VALID: {skippedQuestFile} => renders the quest folder path and the load failure reason', () => {
      const proxy = UnreadableQuestRowLayerWidgetProxy();
      const skippedQuestFile = SkippedQuestFileStub({
        questFolder: '4226b8d1' as never,
        reason: "workItems.1.role: received 'pathseeker'" as never,
      });

      mantineRenderAdapter({
        ui: <UnreadableQuestRowLayerWidget skippedQuestFile={skippedQuestFile} />,
      });

      expect(proxy.getRowText()).toBe(
        "4226b8d1/quest.jsonUNREADABLEworkItems.1.role: received 'pathseeker'",
      );
    });
  });
});

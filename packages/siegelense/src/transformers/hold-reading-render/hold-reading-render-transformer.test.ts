import { HoldReadingStub } from '../../contracts/hold-reading/hold-reading.stub';
import { holdReadingRenderTransformer } from './hold-reading-render-transformer';

describe('holdReadingRenderTransformer', () => {
  describe('rendering', () => {
    it('VALID: {a hold reading} => serializes the reading to JSON', () => {
      const reading = HoldReadingStub();

      const result = holdReadingRenderTransformer({ reading });

      expect(result).toBe(
        '{"frames":4,"differing":0,"verdict":"NOTHING CHANGED across 4.5s","shots":["/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1_frame1.png","/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1_frame2.png"]}',
      );
    });
  });
});

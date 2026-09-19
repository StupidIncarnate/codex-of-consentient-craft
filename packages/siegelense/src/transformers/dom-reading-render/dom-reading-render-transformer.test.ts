import { DomReadingStub } from '../../contracts/dom-reading/dom-reading.stub';
import { domReadingRenderTransformer } from './dom-reading-render-transformer';

describe('domReadingRenderTransformer', () => {
  describe('rendering', () => {
    it('VALID: {a dom reading} => serializes the reading to JSON', () => {
      const reading = DomReadingStub();

      const result = domReadingRenderTransformer({ reading });

      expect(result).toBe(
        '{"count":1,"showing":1,"capped":false,"note":null,"nodes":[{"tagName":"button","testId":"SUBMIT_BTN","className":"btn primary","childCount":0,"display":"inline-block","visibility":"visible","opacity":"1","rect":{"x":10,"y":20,"width":100,"height":50},"text":"Submit","attrs":[],"value":null}]}',
      );
    });
  });
});

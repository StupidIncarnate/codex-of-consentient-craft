import { queueMetadataContract } from './queue-metadata-contract';
import { QueueMetadataStub } from './queue-metadata.stub';

describe('queueMetadataContract', () => {
  describe('valid metadata', () => {
    it('VALID: {counter: 0} => parses zero counter', () => {
      const metadata = QueueMetadataStub({ counter: 0 });

      const result = queueMetadataContract.parse(metadata);

      expect(result.counter).toBe(0);
    });

    it('VALID: {counter: 5} => parses non-zero counter', () => {
      const metadata = QueueMetadataStub({ counter: 5 });

      const result = queueMetadataContract.parse(metadata);

      expect(result.counter).toBe(5);
    });

    it('VALID: QueueMetadataStub() => returns default counter 0', () => {
      const result = QueueMetadataStub();

      expect(result.counter).toBe(0);
    });
  });

  describe('invalid metadata', () => {
    it('INVALID: {counter: -1} => throws for negative counter', () => {
      expect(() => {
        return queueMetadataContract.parse({ counter: -1 });
      }).toThrow(/too_small|minimum/iu);
    });

    it('INVALID: {counter: 1.5} => throws for non-integer counter', () => {
      expect(() => {
        return queueMetadataContract.parse({ counter: 1.5 });
      }).toThrow(/integer/iu);
    });

    it('INVALID: {} => throws for missing counter field', () => {
      expect(() => {
        return queueMetadataContract.parse({});
      }).toThrow(/required/iu);
    });
  });
});

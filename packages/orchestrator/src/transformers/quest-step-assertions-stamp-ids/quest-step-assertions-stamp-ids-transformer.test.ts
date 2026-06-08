import { questStepAssertionsStampIdsTransformer } from './quest-step-assertions-stamp-ids-transformer';
import { questStepAssertionsStampIdsTransformerProxy } from './quest-step-assertions-stamp-ids-transformer.proxy';

describe('questStepAssertionsStampIdsTransformer', () => {
  describe('stamps missing ids', () => {
    it('VALID: {step with one assertion lacking id} => assertion gets the minted uuid', () => {
      const proxy = questStepAssertionsStampIdsTransformerProxy();
      proxy.setupUuids({ uuids: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'] });

      const result = questStepAssertionsStampIdsTransformer({
        steps: [
          {
            id: 'web-quest-delete-broker',
            assertions: [{ prefix: 'VALID', input: '{x}', expected: 'y' }],
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          id: 'web-quest-delete-broker',
          assertions: [
            {
              id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
              prefix: 'VALID',
              input: '{x}',
              expected: 'y',
            },
          ],
        },
      ]);
    });

    it('VALID: {assertion already has id} => id is left unchanged', () => {
      const proxy = questStepAssertionsStampIdsTransformerProxy();
      proxy.setupUuids({ uuids: ['ffffffff-e5f6-4a5b-8c9d-0e1f2a3b4c5d'] });

      const result = questStepAssertionsStampIdsTransformer({
        steps: [
          {
            id: 'web-quest-delete-broker',
            assertions: [
              {
                id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                prefix: 'VALID',
                input: '{x}',
                expected: 'y',
              },
            ],
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          id: 'web-quest-delete-broker',
          assertions: [
            {
              id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
              prefix: 'VALID',
              input: '{x}',
              expected: 'y',
            },
          ],
        },
      ]);
    });

    it('VALID: {mixed id/no-id assertions} => only the no-id assertion is stamped', () => {
      const proxy = questStepAssertionsStampIdsTransformerProxy();
      proxy.setupUuids({ uuids: ['bbbbbbbb-e5f6-4a5b-8c9d-0e1f2a3b4c5d'] });

      const result = questStepAssertionsStampIdsTransformer({
        steps: [
          {
            id: 'web-quest-delete-broker',
            assertions: [
              {
                id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                prefix: 'VALID',
                input: '{kept}',
                expected: 'unchanged',
              },
              { prefix: 'ERROR', input: '{new}', expected: 'stamped' },
            ],
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          id: 'web-quest-delete-broker',
          assertions: [
            {
              id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
              prefix: 'VALID',
              input: '{kept}',
              expected: 'unchanged',
            },
            {
              id: 'bbbbbbbb-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
              prefix: 'ERROR',
              input: '{new}',
              expected: 'stamped',
            },
          ],
        },
      ]);
    });
  });

  describe('steps without assertions', () => {
    it('VALID: {partial-patch step with no assertions key} => step returned unchanged', () => {
      questStepAssertionsStampIdsTransformerProxy();

      const result = questStepAssertionsStampIdsTransformer({
        steps: [{ id: 'web-quest-delete-broker', instructions: ['do a thing'] }],
      });

      expect(result).toStrictEqual([
        { id: 'web-quest-delete-broker', instructions: ['do a thing'] },
      ]);
    });

    it('VALID: {delete-marker step} => step returned unchanged', () => {
      questStepAssertionsStampIdsTransformerProxy();

      const result = questStepAssertionsStampIdsTransformer({
        steps: [{ id: 'web-old-step', _delete: true }],
      });

      expect(result).toStrictEqual([{ id: 'web-old-step', _delete: true }]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      questStepAssertionsStampIdsTransformerProxy();

      const result = questStepAssertionsStampIdsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { domIdMaskTransformer } from './dom-id-mask-transformer';

describe('domIdMaskTransformer', () => {
  describe('a minted segment', () => {
    it.each([
      ['mantine-gwrqe5vg6', 'mantine-*'],
      ['mantine-oxhnuns51', 'mantine-*'],
      ['mantine-gwrqe5vg6-label', 'mantine-*-label'],
      ['mantine-nsg303p87-label', 'mantine-*-label'],
      ['field_9f8e7d6c5b_input', 'field_*_input'],
    ])('VALID: {domId: %s} => %s', (domId, expected) => {
      const result = domIdMaskTransformer({ domId: ContentTextStub({ value: domId }) });

      expect(result).toBe(expected);
    });
  });

  describe('a stable id', () => {
    it.each(['root', 'EXECUTION_ROW_0', 'quest-row-2', 'main-content'])(
      'VALID: {domId: %s} => printed whole',
      (domId) => {
        const result = domIdMaskTransformer({ domId: ContentTextStub({ value: domId }) });

        expect(result).toBe(domId);
      },
    );
  });
});

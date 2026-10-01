import { PastedImageUploadStub } from '@dungeonmaster/shared/contracts/pasted-image-upload/pasted-image-upload.stub';

import { questClarifyBodyContract } from './quest-clarify-body-contract';
import { QuestClarifyBodyStub } from './quest-clarify-body.stub';

describe('questClarifyBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub default => parses successfully', () => {
      const result = QuestClarifyBodyStub();

      expect(result).toStrictEqual({
        answers: [{ header: 'q1', labels: ['a1'] }],
        questions: [
          {
            question: 'a question',
            header: 'q1',
            options: [{ label: 'a1', description: 'first option' }],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {questions: []} => parses with no questions', () => {
      const result = questClarifyBodyContract.parse({
        answers: [{ header: 'q1', labels: ['a1'] }],
        questions: [],
      });

      expect(result).toStrictEqual({ answers: [{ header: 'q1', labels: ['a1'] }], questions: [] });
    });

    it('VALID: {labels: [Alpha, Gamma], text: prefer Gamma} => parses both labels and the text', () => {
      const result = questClarifyBodyContract.parse({
        answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
        questions: [],
      });

      expect(result).toStrictEqual({
        answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
        questions: [],
      });
    });

    it('VALID: {labels: [], text: my own answer} => parses a typed-only answer', () => {
      const result = questClarifyBodyContract.parse({
        answers: [{ header: 'Letters', labels: [], text: 'my own answer' }],
        questions: [],
      });

      expect(result).toStrictEqual({
        answers: [{ header: 'Letters', labels: [], text: 'my own answer' }],
        questions: [],
      });
    });
  });

  describe('answer images', () => {
    it('VALID: {answer with one png} => parses and keeps the image on its answer', () => {
      const result = questClarifyBodyContract.parse({
        answers: [
          {
            header: 'Shape',
            labels: [],
            text: '[Pasted Image 1] like this',
            images: [{ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' }],
          },
        ],
        questions: [],
      });

      expect(result).toStrictEqual({
        answers: [
          {
            header: 'Shape',
            labels: [],
            text: '[Pasted Image 1] like this',
            images: [{ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' }],
          },
        ],
        questions: [],
      });
    });

    it('VALID: {answer with 5 images} => parses at the per-answer cap', () => {
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      const result = questClarifyBodyContract.parse({
        answers: [
          { header: 'Shape', labels: ['Round'], images: [image, image, image, image, image] },
        ],
        questions: [],
      });

      expect(result.answers[0]?.images).toStrictEqual([image, image, image, image, image]);
    });

    it('INVALID: {answer with 6 images} => throws on the per-answer cap', () => {
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      expect(() => {
        questClarifyBodyContract.parse({
          answers: [
            {
              header: 'Shape',
              labels: ['Round'],
              images: [image, image, image, image, image, image],
            },
          ],
          questions: [],
        });
      }).toThrow(/<=5/u);
    });

    it('INVALID: {answer with image/bmp} => throws on the media type', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [
            {
              header: 'Shape',
              labels: ['Round'],
              images: [{ mediaType: 'image/bmp', dataBase64: 'Ym1w' }],
            },
          ],
          questions: [],
        });
      }).toThrow(/Invalid option: expected one of/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {answers: []} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [], questions: [] });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {answers: [{header only}]} => throws on the missing labels', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [{ header: 'q1' }], questions: [] });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {labels: [], no text} => throws because the answer has nothing to send', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'Letters', labels: [] }],
          questions: [],
        });
      }).toThrow(/A clarification answer needs at least one label or non-blank text/u);
    });

    it('INVALID: {labels: [], text: whitespace only} => throws because the text trims to empty', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'Letters', labels: [], text: '   ' }],
          questions: [],
        });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {labels: [empty string]} => throws on the empty label', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'Letters', labels: [''] }],
          questions: [],
        });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {questions: [{id, text}]} => throws on the malformed question', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'q1', labels: ['a1'] }],
          questions: [{ id: 'q1', text: 'a question' }],
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({});
      }).toThrow(/received undefined/u);
    });
  });
});

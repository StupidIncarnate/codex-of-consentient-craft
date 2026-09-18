import { domStatics } from './dom-statics';

describe('domStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(domStatics).toStrictEqual({
      limits: {
        maxMatches: 10,
        textChars: 4000,
      },
      fields: {
        all: [
          'count',
          'showing',
          'capped',
          'tagName',
          'testId',
          'className',
          'childCount',
          'display',
          'visibility',
          'opacity',
          'rect',
          'text',
          'attrs',
          'value',
        ],
        defaultNodeFields: [
          'tagName',
          'testId',
          'className',
          'childCount',
          'display',
          'visibility',
          'opacity',
          'rect',
          'text',
          'attrs',
          'value',
        ],
      },
      textModes: {
        all: ['own', 'full'],
        default: 'own',
      },
    });
  });

  it('VALID: {fields.defaultNodeFields} => every member is also in fields.all', () => {
    const isSubsetOfAll = domStatics.fields.defaultNodeFields.every((field) =>
      domStatics.fields.all.includes(field),
    );

    expect(isSubsetOfAll).toBe(true);
  });
});

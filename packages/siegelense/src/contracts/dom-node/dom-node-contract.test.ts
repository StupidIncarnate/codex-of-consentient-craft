import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DomRectStub } from '../dom-rect/dom-rect.stub';
import { domNodeContract } from './dom-node-contract';
import { DomNodeStub } from './dom-node.stub';

describe('domNodeContract', () => {
  it('VALID: {default stub} => parses exact DomNode shape', () => {
    const node = DomNodeStub();

    const result = domNodeContract.parse(node);

    expect(result).toStrictEqual({
      tagName: 'button',
      testId: 'SUBMIT_BTN',
      className: 'btn primary',
      childCount: 0,
      display: 'inline-block',
      visibility: 'visible',
      opacity: '1',
      rect: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
      text: 'Submit',
      attrs: [],
      value: null,
    });
  });

  it('VALID: {projected node with only text and rect} => parses sparse projected shape', () => {
    const projected = DomNodeStub({
      tagName: undefined,
      testId: undefined,
      className: undefined,
      childCount: undefined,
      display: undefined,
      visibility: undefined,
      opacity: undefined,
      rect: DomRectStub(),
      text: ContentTextStub({ value: 'Submit' }),
      attrs: undefined,
      value: undefined,
    });

    const result = domNodeContract.parse(projected);

    expect(result).toStrictEqual({
      text: 'Submit',
      rect: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
    });
  });

  it('INVALID: {unrecognized extra key} => throws strict validation error', () => {
    expect(() => {
      domNodeContract.parse({ tagName: 'div', unknownProperty: true });
    }).toThrow(/Unrecognized key/u);
  });
});

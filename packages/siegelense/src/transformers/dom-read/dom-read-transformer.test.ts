import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DomRectStub } from '../../contracts/dom-rect/dom-rect.stub';
import { RawDomReadingStub } from '../../contracts/raw-dom-reading/raw-dom-reading.stub';
import { ReadingCountStub } from '../../contracts/reading-count/reading-count.stub';
import { domReadTransformer } from './dom-read-transformer';

describe('domReadTransformer', () => {
  describe('readSource()', () => {
    it('VALID: {readSource} => uses querySelectorAll and never querySelector', () => {
      const domRead = domReadTransformer();

      const source = domRead.readSource({ target: '[data-testid="BTN"]', text: null });

      expect(source.indexOf('querySelectorAll(')).toBeGreaterThanOrEqual(0);
      expect(source.indexOf('querySelector(')).toBe(-1);
    });

    it('VALID: {text: "full"} => enables textContent read', () => {
      const domRead = domReadTransformer();

      const source = domRead.readSource({
        target: '[data-testid="BTN"]',
        text: 'full',
      });

      expect(source.indexOf('element.textContent')).toBeGreaterThanOrEqual(0);
    });

    it('VALID: {text: "own"} => reads own text nodes via nodeType 3', () => {
      const domRead = domReadTransformer();

      const source = domRead.readSource({
        target: '[data-testid="BTN"]',
        text: 'own',
      });

      expect(source.indexOf('node.nodeType === 3')).toBeGreaterThanOrEqual(0);
    });

    it('VALID: {target embedding} => embeds target as JSON string', () => {
      const domRead = domReadTransformer();

      const source = domRead.readSource({
        target: '[data-testid="BTN"]',
        text: null,
      });

      expect(source.indexOf('"[data-testid=\\"BTN\\"]"')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('toReading()', () => {
    it('VALID: {raw matches within cap} => returns un-capped reading with full nodes', () => {
      const domRead = domReadTransformer();

      const raw = RawDomReadingStub();

      const result = domRead.toReading({ raw, fields: null });

      expect(result).toStrictEqual({
        count: 1,
        showing: 1,
        capped: false,
        note: null,
        nodes: [
          {
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
          },
        ],
      });
    });

    it('VALID: {fields: ["count"]} => returns pure count reading without nodes', () => {
      const domRead = domReadTransformer();

      const raw = RawDomReadingStub({
        count: ReadingCountStub({ value: 42 }),
        nodes: [],
      });

      const result = domRead.toReading({
        raw,
        fields: ['count'],
      });

      expect(result).toStrictEqual({
        count: 42,
      });
    });

    it('VALID: {fields: ["text", "rect"]} => projects nodes to only text and rect', () => {
      const domRead = domReadTransformer();

      const raw = RawDomReadingStub();

      const result = domRead.toReading({
        raw,
        fields: ['text', 'rect'],
      });

      expect(result).toStrictEqual({
        count: 1,
        showing: 1,
        capped: false,
        note: null,
        nodes: [
          {
            text: 'Submit',
            rect: {
              x: 10,
              y: 20,
              width: 100,
              height: 50,
            },
          },
        ],
      });
    });

    it('VALID: {count > showing} => sets capped true with warning note', () => {
      const domRead = domReadTransformer();

      const raw = RawDomReadingStub({
        count: ReadingCountStub({ value: 58 }),
        nodes: [
          {
            tagName: ContentTextStub({ value: 'div' }),
            testId: null,
            className: null,
            childCount: ReadingCountStub({ value: 0 }),
            display: ContentTextStub({ value: 'block' }),
            visibility: ContentTextStub({ value: 'visible' }),
            opacity: ContentTextStub({ value: '1' }),
            rect: DomRectStub(),
            text: ContentTextStub({ value: 'Item' }),
            attrs: [],
            value: null,
          },
        ],
      });

      const result = domRead.toReading({ raw, fields: null });

      expect(result).toStrictEqual({
        count: 58,
        showing: 1,
        capped: true,
        note: 'count: 58, showing 1, capped. Narrow this.',
        nodes: [
          {
            tagName: 'div',
            testId: null,
            className: null,
            childCount: 0,
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            rect: {
              x: 10,
              y: 20,
              width: 100,
              height: 50,
            },
            text: 'Item',
            attrs: [],
            value: null,
          },
        ],
      });
    });
  });
});

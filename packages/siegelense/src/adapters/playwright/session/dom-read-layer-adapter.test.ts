import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DomFieldStub } from '../../../contracts/dom-field/dom-field.stub';
import { DomRectStub } from '../../../contracts/dom-rect/dom-rect.stub';
import { DomTextModeStub } from '../../../contracts/dom-text-mode/dom-text-mode.stub';
import { RawDomReadingStub } from '../../../contracts/raw-dom-reading/raw-dom-reading.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { domReadLayerAdapter } from './dom-read-layer-adapter';
import { domReadLayerAdapterProxy } from './dom-read-layer-adapter.proxy';

describe('domReadLayerAdapter', () => {
  describe('readSource()', () => {
    it('VALID: {readSource} => uses querySelectorAll and never querySelector', () => {
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const source = adapter.readSource({ target: '[data-testid="BTN"]', text: null });

      expect(source.indexOf('querySelectorAll(')).toBeGreaterThanOrEqual(0);
      expect(source.indexOf('querySelector(')).toBe(-1);
    });

    it('VALID: {text: "full"} => enables textContent read', () => {
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const source = adapter.readSource({
        target: '[data-testid="BTN"]',
        text: DomTextModeStub({ value: 'full' }),
      });

      expect(source.indexOf('element.textContent')).toBeGreaterThanOrEqual(0);
    });

    it('VALID: {text: "own"} => reads own text nodes via nodeType 3', () => {
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const source = adapter.readSource({
        target: '[data-testid="BTN"]',
        text: DomTextModeStub({ value: 'own' }),
      });

      expect(source.indexOf('node.nodeType === 3')).toBeGreaterThanOrEqual(0);
    });

    it('VALID: {target embedding} => embeds target as JSON string', () => {
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const source = adapter.readSource({
        target: '[data-testid="BTN"]',
        text: null,
      });

      expect(source.indexOf('"[data-testid=\\"BTN\\"]"')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('toReading()', () => {
    it('VALID: {raw matches within cap} => returns un-capped reading with full nodes', () => {
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const raw = RawDomReadingStub();

      const result = adapter.toReading({ raw, fields: null });

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
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const raw = RawDomReadingStub({
        count: ReadingCountStub({ value: 42 }),
        nodes: [],
      });

      const result = adapter.toReading({
        raw,
        fields: [DomFieldStub({ value: 'count' })],
      });

      expect(result).toStrictEqual({
        count: 42,
      });
    });

    it('VALID: {fields: ["text", "rect"]} => projects nodes to only text and rect', () => {
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

      const raw = RawDomReadingStub();

      const result = adapter.toReading({
        raw,
        fields: [DomFieldStub({ value: 'text' }), DomFieldStub({ value: 'rect' })],
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
      domReadLayerAdapterProxy();
      const adapter = domReadLayerAdapter();

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

      const result = adapter.toReading({ raw, fields: null });

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

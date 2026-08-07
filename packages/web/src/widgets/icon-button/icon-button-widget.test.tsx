import { IconSend, IconTrash } from '@tabler/icons-react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ButtonLabelStub } from '../../contracts/button-label/button-label.stub';
import { ButtonVariantStub } from '../../contracts/button-variant/button-variant.stub';
import { IconButtonSizeStub } from '../../contracts/icon-button-size/icon-button-size.stub';
import { TestIdStub } from '../../contracts/test-id/test-id.stub';
import { iconButtonStatics } from '../../statics/icon-button/icon-button-statics';

import { IconButtonWidget } from './icon-button-widget';
import { IconButtonWidgetProxy } from './icon-button-widget.proxy';

const LABEL = ButtonLabelStub({ value: 'Send queued comments' });
const TEST_ID = TestIdStub({ value: 'ICON_BUTTON' });
// The Ember Depths tokens this widget paints, as jsdom normalises them out of the inline style:
// bg-raised #2a1a14, text #e0cfc0, primary #ff6b35, danger #ef4444, bg-deep #0d0907.
const BROWN_BACKGROUND = 'rgb(42, 26, 20)';
const BROWN_FOREGROUND = 'rgb(224, 207, 192)';
const ORANGE_BACKGROUND = 'rgb(255, 107, 53)';
const RED_BACKGROUND = 'rgb(239, 68, 68)';
const DEEP_FOREGROUND = 'rgb(13, 9, 7)';

// Every member of the size scale, derived from the statics that own it so a member added there is
// never silently left uncovered here.
type SizeMember = keyof typeof iconButtonStatics.glyphPx;
const SIZE_MEMBERS = Object.keys(iconButtonStatics.glyphPx) as readonly SizeMember[];

describe('IconButtonWidget', () => {
  describe('rendering', () => {
    it('VALID: {label, icon, onClick} => renders the glyph it was handed, as a button under the accessible name', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: <IconButtonWidget label={LABEL} icon={IconSend} onClick={jest.fn()} testId={TEST_ID} />,
      });

      expect(proxy.glyph()).toBe('IconSend');
      expect(proxy.accessibleName()).toBe('Send queued comments');
      expect(proxy.tagName()).toBe('BUTTON');
    });

    it('VALID: {rendered} => the button carries the shared near-square corner radius', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: <IconButtonWidget label={LABEL} icon={IconSend} onClick={jest.fn()} testId={TEST_ID} />,
      });

      expect(proxy.borderRadius()).toBe(`${String(iconButtonStatics.borderRadiusPx)}px`);
    });
  });

  describe('size', () => {
    it('VALID: {no size} => falls back to the shared small member of the Mantine scale', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: <IconButtonWidget label={LABEL} icon={IconSend} onClick={jest.fn()} testId={TEST_ID} />,
      });

      expect(proxy.size()).toBe(`var(--ai-size-${iconButtonStatics.sizes.small})`);
      expect(proxy.glyphSize()).toBe(String(iconButtonStatics.glyphPx.sm));
    });

    it.each(SIZE_MEMBERS)(
      'VALID: {size: %s} => passes that member to the Mantine scale and sizes the glyph to match',
      (member) => {
        const proxy = IconButtonWidgetProxy();

        mantineRenderAdapter({
          ui: (
            <IconButtonWidget
              label={LABEL}
              icon={IconSend}
              onClick={jest.fn()}
              testId={TEST_ID}
              size={IconButtonSizeStub({ value: member })}
            />
          ),
        });

        expect(proxy.size()).toBe(`var(--ai-size-${member})`);
        expect(proxy.glyphSize()).toBe(String(iconButtonStatics.glyphPx[member]));
      },
    );
  });

  describe('colour variants', () => {
    it('VALID: {no variant} => renders the default brown treatment', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: <IconButtonWidget label={LABEL} icon={IconSend} onClick={jest.fn()} testId={TEST_ID} />,
      });

      expect(proxy.background()).toBe(BROWN_BACKGROUND);
      expect(proxy.foreground()).toBe(BROWN_FOREGROUND);
    });

    it('VALID: {variant: ghost} => renders the same brown treatment omitting the variant does', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <IconButtonWidget
            label={LABEL}
            icon={IconSend}
            onClick={jest.fn()}
            testId={TEST_ID}
            variant={ButtonVariantStub({ value: 'ghost' })}
          />
        ),
      });

      expect(proxy.background()).toBe(BROWN_BACKGROUND);
      expect(proxy.foreground()).toBe(BROWN_FOREGROUND);
    });

    it('VALID: {variant: primary} => renders the orange fill PLAY and SEND carry', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <IconButtonWidget
            label={LABEL}
            icon={IconSend}
            onClick={jest.fn()}
            testId={TEST_ID}
            variant={ButtonVariantStub({ value: 'primary' })}
          />
        ),
      });

      expect(proxy.background()).toBe(ORANGE_BACKGROUND);
      expect(proxy.foreground()).toBe(DEEP_FOREGROUND);
    });

    it('VALID: {variant: danger} => renders the STOP red fill', () => {
      const proxy = IconButtonWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <IconButtonWidget
            label={LABEL}
            icon={IconTrash}
            onClick={jest.fn()}
            testId={TEST_ID}
            variant={ButtonVariantStub({ value: 'danger' })}
          />
        ),
      });

      expect(proxy.background()).toBe(RED_BACKGROUND);
      expect(proxy.foreground()).toBe(DEEP_FOREGROUND);
    });
  });

  describe('interaction', () => {
    it('VALID: {click} => calls onClick exactly once', async () => {
      const proxy = IconButtonWidgetProxy();
      const onClick = jest.fn();

      mantineRenderAdapter({
        ui: <IconButtonWidget label={LABEL} icon={IconSend} onClick={onClick} testId={TEST_ID} />,
      });
      await proxy.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('VALID: {disabled} => the button is disabled and a click never reaches onClick', async () => {
      const proxy = IconButtonWidgetProxy();
      const onClick = jest.fn();

      mantineRenderAdapter({
        ui: (
          <IconButtonWidget
            label={LABEL}
            icon={IconSend}
            onClick={onClick}
            testId={TEST_ID}
            disabled
          />
        ),
      });
      await proxy.click();

      expect(proxy.isDisabled()).toBe(true);
      expect(onClick).toHaveBeenCalledTimes(0);
    });
  });
});

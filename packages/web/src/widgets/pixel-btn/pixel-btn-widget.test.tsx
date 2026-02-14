import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ButtonLabelStub } from '../../contracts/button-label/button-label.stub';
import { ButtonVariantStub } from '../../contracts/button-variant/button-variant.stub';
import { PixelBtnWidget } from './pixel-btn-widget';
import { PixelBtnWidgetProxy } from './pixel-btn-widget.proxy';

describe('PixelBtnWidget', () => {
  describe('rendering', () => {
    it('VALID: {label: "CREATE"} => renders button with label text', () => {
      const proxy = PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'CREATE' });
      const onClick = jest.fn();

      mantineRenderAdapter({ ui: <PixelBtnWidget label={label} onClick={onClick} /> });

      expect(proxy.hasLabel({ text: 'CREATE' })).toBe(true);
    });

    it('VALID: {variant: "primary"} => renders with primary background color', () => {
      PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'GO' });
      const variant = ButtonVariantStub({ value: 'primary' });
      const onClick = jest.fn();

      mantineRenderAdapter({
        ui: <PixelBtnWidget label={label} onClick={onClick} variant={variant} />,
      });

      const button = screen.getByTestId('PIXEL_BTN');

      expect(button.style.backgroundColor).toBe('rgb(255, 107, 53)');
    });

    it('VALID: {variant: "ghost"} => renders with ghost background color', () => {
      PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'CANCEL' });
      const variant = ButtonVariantStub({ value: 'ghost' });
      const onClick = jest.fn();

      mantineRenderAdapter({
        ui: <PixelBtnWidget label={label} onClick={onClick} variant={variant} />,
      });

      const button = screen.getByTestId('PIXEL_BTN');

      expect(button.style.backgroundColor).toBe('rgb(42, 26, 20)');
    });

    it('VALID: {icon: true} => renders with icon font size', () => {
      PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'X' });
      const onClick = jest.fn();

      mantineRenderAdapter({ ui: <PixelBtnWidget label={label} onClick={onClick} icon={true} /> });

      const button = screen.getByTestId('PIXEL_BTN');

      expect(button.style.fontSize).toBe('15px');
    });

    it('VALID: {icon not set} => renders with normal font size', () => {
      PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'SAVE' });
      const onClick = jest.fn();

      mantineRenderAdapter({ ui: <PixelBtnWidget label={label} onClick={onClick} /> });

      const button = screen.getByTestId('PIXEL_BTN');

      expect(button.style.fontSize).toBe('11px');
    });
  });

  describe('interaction', () => {
    it('VALID: {click} => calls onClick handler', async () => {
      const proxy = PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'CLICK ME' });
      const onClick = jest.fn();

      mantineRenderAdapter({ ui: <PixelBtnWidget label={label} onClick={onClick} /> });

      await proxy.clickButton();

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('default variant', () => {
    it('VALID: {no variant} => defaults to primary styling', () => {
      PixelBtnWidgetProxy();
      const label = ButtonLabelStub({ value: 'DEFAULT' });
      const onClick = jest.fn();

      mantineRenderAdapter({ ui: <PixelBtnWidget label={label} onClick={onClick} /> });

      const button = screen.getByTestId('PIXEL_BTN');

      expect(button.style.backgroundColor).toBe('rgb(255, 107, 53)');
    });
  });
});

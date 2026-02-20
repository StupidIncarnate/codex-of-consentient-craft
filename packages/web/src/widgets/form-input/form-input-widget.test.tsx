import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CssColorOverrideStub } from '../../contracts/css-color-override/css-color-override.stub';
import { CssDimensionStub } from '../../contracts/css-dimension/css-dimension.stub';
import { CssSpacingStub } from '../../contracts/css-spacing/css-spacing.stub';
import { FormInputValueStub } from '../../contracts/form-input-value/form-input-value.stub';
import { FormPlaceholderStub } from '../../contracts/form-placeholder/form-placeholder.stub';
import { FormInputWidget } from './form-input-widget';
import { FormInputWidgetProxy } from './form-input-widget.proxy';

describe('FormInputWidget', () => {
  describe('rendering', () => {
    it('VALID: {value: "hello"} => renders input with value', () => {
      const proxy = FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'hello' });
      const onChange = jest.fn();

      mantineRenderAdapter({ ui: <FormInputWidget value={value} onChange={onChange} /> });

      expect(proxy.getValue()).toBe('hello');
    });

    it('VALID: {placeholder: "Enter..."} => renders input with placeholder attribute', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: '' });
      const placeholder = FormPlaceholderStub({ value: 'Enter...' });
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormInputWidget value={value} onChange={onChange} placeholder={placeholder} />,
      });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.getAttribute('placeholder')).toBe('Enter...');
    });

    it('VALID: {color: "#ff0000"} => renders with custom color', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'test' });
      const color = CssColorOverrideStub({ value: '#ff0000' });
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormInputWidget value={value} onChange={onChange} color={color} />,
      });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.style.color).toBe('rgb(255, 0, 0)');
    });

    it('VALID: {no color} => renders with default theme text color', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'test' });
      const onChange = jest.fn();

      mantineRenderAdapter({ ui: <FormInputWidget value={value} onChange={onChange} /> });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.style.color).toBe('rgb(224, 207, 192)');
    });

    it('VALID: {width: 200} => renders with custom width', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'test' });
      const width = CssDimensionStub({ value: 200 });
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormInputWidget value={value} onChange={onChange} width={width} />,
      });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.style.width).toBe('200px');
    });

    it('VALID: {mt: 8} => renders with custom margin top', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'test' });
      const mt = CssSpacingStub({ value: 8 });
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormInputWidget value={value} onChange={onChange} mt={mt} />,
      });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.style.marginTop).toBe('8px');
    });
  });

  describe('interaction', () => {
    it('VALID: {type "world"} => calls onChange for each character', async () => {
      const proxy = FormInputWidgetProxy();
      const value = FormInputValueStub({ value: '' });
      const onChange = jest.fn();

      mantineRenderAdapter({ ui: <FormInputWidget value={value} onChange={onChange} /> });

      await proxy.changeValue({ value: FormInputValueStub({ value: 'world' }) });

      expect(onChange).toHaveBeenCalledWith('w');
    });
  });

  describe('default values', () => {
    it('VALID: {no width} => defaults to 100% width', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'test' });
      const onChange = jest.fn();

      mantineRenderAdapter({ ui: <FormInputWidget value={value} onChange={onChange} /> });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.style.width).toBe('100%');
    });

    it('VALID: {no mt} => defaults to 0 margin top', () => {
      FormInputWidgetProxy();
      const value = FormInputValueStub({ value: 'test' });
      const onChange = jest.fn();

      mantineRenderAdapter({ ui: <FormInputWidget value={value} onChange={onChange} /> });

      const input = screen.getByTestId('FORM_INPUT');

      expect(input.style.marginTop).toBe('0px');
    });
  });
});

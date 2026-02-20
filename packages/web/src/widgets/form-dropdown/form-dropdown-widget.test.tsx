import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CssColorOverrideStub } from '../../contracts/css-color-override/css-color-override.stub';
import { CssDimensionStub } from '../../contracts/css-dimension/css-dimension.stub';
import { DropdownOptionStub } from '../../contracts/dropdown-option/dropdown-option.stub';
import { FormDropdownWidget } from './form-dropdown-widget';
import { FormDropdownWidgetProxy } from './form-dropdown-widget.proxy';

describe('FormDropdownWidget', () => {
  describe('rendering', () => {
    it('VALID: {value: "high", options: ["low","medium","high"]} => renders select with value', () => {
      const proxy = FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'high' });
      const options = [
        DropdownOptionStub({ value: 'low' }),
        DropdownOptionStub({ value: 'medium' }),
        DropdownOptionStub({ value: 'high' }),
      ];
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      expect(proxy.getValue()).toBe('high');
    });

    it('VALID: {options: ["a","b","c"]} => renders all option elements', () => {
      FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'a' });
      const options = [
        DropdownOptionStub({ value: 'a' }),
        DropdownOptionStub({ value: 'b' }),
        DropdownOptionStub({ value: 'c' }),
      ];
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      const select = screen.getByTestId('FORM_DROPDOWN');
      const optionElements = select.querySelectorAll('option');

      expect(optionElements).toHaveLength(3);
    });

    it('VALID: {color: "#ff0000"} => renders with custom color', () => {
      FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'a' });
      const options = [DropdownOptionStub({ value: 'a' })];
      const color = CssColorOverrideStub({ value: '#ff0000' });
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FormDropdownWidget value={value} options={options} onChange={onChange} color={color} />
        ),
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.color).toBe('rgb(255, 0, 0)');
    });

    it('VALID: {no color} => renders with default theme text color', () => {
      FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'a' });
      const options = [DropdownOptionStub({ value: 'a' })];
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.color).toBe('rgb(224, 207, 192)');
    });

    it('VALID: {width: 200} => renders with custom width', () => {
      FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'a' });
      const options = [DropdownOptionStub({ value: 'a' })];
      const width = CssDimensionStub({ value: 200 });
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FormDropdownWidget value={value} options={options} onChange={onChange} width={width} />
        ),
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.width).toBe('200px');
    });
  });

  describe('interaction', () => {
    it('VALID: {select "medium"} => calls onChange with selected value', async () => {
      const proxy = FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'low' });
      const options = [
        DropdownOptionStub({ value: 'low' }),
        DropdownOptionStub({ value: 'medium' }),
        DropdownOptionStub({ value: 'high' }),
      ];
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      await proxy.selectOption({ value: DropdownOptionStub({ value: 'medium' }) });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('default values', () => {
    it('VALID: {no width} => defaults to auto width', () => {
      FormDropdownWidgetProxy();
      const value = DropdownOptionStub({ value: 'a' });
      const options = [DropdownOptionStub({ value: 'a' })];
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.width).toBe('auto');
    });
  });
});

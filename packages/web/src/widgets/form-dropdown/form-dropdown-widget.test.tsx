import { screen } from '#gateway/npm/testing-library__react';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { FormDropdownWidget } from './form-dropdown-widget';
import { FormDropdownWidgetProxy } from './form-dropdown-widget.proxy';

describe('FormDropdownWidget', () => {
  describe('rendering', () => {
    it('VALID: {value: "high", options: ["low","medium","high"]} => renders select with value', () => {
      const proxy = FormDropdownWidgetProxy();
      const value = 'high';
      const options = ['low', 'medium', 'high'];
      const onChange = jest.fn();

      mantineRenderMiddleware({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      expect(proxy.getValue()).toBe('high');
    });

    it('VALID: {options: ["a","b","c"]} => renders all option elements', () => {
      FormDropdownWidgetProxy();
      const value = 'a';
      const options = ['a', 'b', 'c'];
      const onChange = jest.fn();

      mantineRenderMiddleware({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      const select = screen.getByTestId('FORM_DROPDOWN');
      const optionElements = select.querySelectorAll('option');

      expect(Array.from(optionElements).map((el) => el.getAttribute('value'))).toStrictEqual([
        'a',
        'b',
        'c',
      ]);
    });

    it('VALID: {color: "#ff0000"} => renders with custom color', () => {
      FormDropdownWidgetProxy();
      const value = 'a';
      const options = ['a'];
      const color = '#ff0000';
      const onChange = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <FormDropdownWidget value={value} options={options} onChange={onChange} color={color} />
        ),
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.color).toBe('rgb(255, 0, 0)');
    });

    it('VALID: {no color} => renders with default theme text color', () => {
      FormDropdownWidgetProxy();
      const value = 'a';
      const options = ['a'];
      const onChange = jest.fn();

      mantineRenderMiddleware({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.color).toBe('rgb(224, 207, 192)');
    });

    it('VALID: {width: 200} => renders with custom width', () => {
      FormDropdownWidgetProxy();
      const value = 'a';
      const options = ['a'];
      const width = '200px';
      const onChange = jest.fn();

      mantineRenderMiddleware({
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
      const value = 'low';
      const options = ['low', 'medium', 'high'];
      const onChange = jest.fn();

      mantineRenderMiddleware({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      await proxy.selectOption({ value: 'medium' });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('default values', () => {
    it('VALID: {no width} => defaults to auto width', () => {
      FormDropdownWidgetProxy();
      const value = 'a';
      const options = ['a'];
      const onChange = jest.fn();

      mantineRenderMiddleware({
        ui: <FormDropdownWidget value={value} options={options} onChange={onChange} />,
      });

      const select = screen.getByTestId('FORM_DROPDOWN');

      expect(select.style.width).toBe('auto');
    });
  });
});

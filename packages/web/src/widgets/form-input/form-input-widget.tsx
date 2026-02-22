/**
 * PURPOSE: Renders a controlled monospace text input with Ember Depths theme styling
 *
 * USAGE:
 * <FormInputWidget value={value} onChange={handleChange} placeholder={placeholder} />
 * // Renders a styled input element with bg-deep background and border
 */

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssDimension } from '../../contracts/css-dimension/css-dimension-contract';
import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const FONT_SIZE = 11;
const BORDER_RADIUS = 2;
const PADDING = '2px 6px';

export interface FormInputWidgetProps {
  value: FormInputValue;
  onChange: (value: FormInputValue) => void;
  placeholder?: FormPlaceholder;
  width?: CssDimension;
  mt?: CssSpacing;
  color?: CssColorOverride;
}

export const FormInputWidget = ({
  value,
  onChange,
  placeholder,
  width = '100%' as CssDimension,
  mt = 0 as CssSpacing,
  color,
}: FormInputWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <input
      data-testid="FORM_INPUT"
      value={value}
      onChange={(event) => {
        onChange(event.target.value as FormInputValue);
      }}
      placeholder={placeholder}
      style={{
        fontFamily: 'monospace',
        fontSize: FONT_SIZE,
        color: color ?? colors.text,
        backgroundColor: colors['bg-deep'],
        border: `1px solid ${colors.border}`,
        borderRadius: BORDER_RADIUS,
        padding: PADDING,
        width,
        marginTop: mt,
        boxSizing: 'border-box',
      }}
    />
  );
};

/**
 * PURPOSE: Renders a controlled monospace select dropdown with Ember Depths theme styling
 *
 * USAGE:
 * <FormDropdownWidget value={value} options={options} onChange={handleChange} />
 * // Renders a styled select element with bg-deep background and border
 */

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssDimension } from '../../contracts/css-dimension/css-dimension-contract';
import type { DropdownOption } from '../../contracts/dropdown-option/dropdown-option-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const FONT_SIZE = 11;
const BORDER_RADIUS = 2;
const PADDING = '2px 6px';

export interface FormDropdownWidgetProps {
  value: DropdownOption;
  options: DropdownOption[];
  onChange: (value: DropdownOption) => void;
  width?: CssDimension;
  color?: CssColorOverride;
}

export const FormDropdownWidget = ({
  value,
  options,
  onChange,
  width = 'auto' as CssDimension,
  color,
}: FormDropdownWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <select
      data-testid="FORM_DROPDOWN"
      value={value}
      onChange={(event) => {
        onChange(event.target.value as DropdownOption);
      }}
      style={{
        fontFamily: 'monospace',
        fontSize: FONT_SIZE,
        color: color ?? colors.text,
        backgroundColor: colors['bg-deep'],
        border: `1px solid ${colors.border}`,
        borderRadius: BORDER_RADIUS,
        padding: PADDING,
        width,
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

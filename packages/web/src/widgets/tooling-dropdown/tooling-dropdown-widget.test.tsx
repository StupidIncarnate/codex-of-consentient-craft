import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ToolingDropdownWidget } from './tooling-dropdown-widget';
import { ToolingDropdownWidgetProxy } from './tooling-dropdown-widget.proxy';

describe('ToolingDropdownWidget', () => {
  it('VALID: {default render} => renders the Tooling icon trigger', () => {
    ToolingDropdownWidgetProxy();

    const { getByTestId } = mantineRenderAdapter({
      ui: <ToolingDropdownWidget onRun={(): void => undefined} />,
    });

    expect(getByTestId('TOOLING_DROPDOWN_TRIGGER').getAttribute('aria-label')).toBe('Tooling');
  });
});

import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SectionCountStub } from '../../contracts/section-count/section-count.stub';
import { SectionLabelStub } from '../../contracts/section-label/section-label.stub';
import { SectionHeaderWidget } from './section-header-widget';
import { SectionHeaderWidgetProxy } from './section-header-widget.proxy';

describe('SectionHeaderWidget', () => {
  describe('rendering', () => {
    it('VALID: {label: "OBJECTIVES"} => renders label text', () => {
      SectionHeaderWidgetProxy();
      const label = SectionLabelStub({ value: 'OBJECTIVES' });

      mantineRenderAdapter({ ui: <SectionHeaderWidget label={label} /> });

      expect(screen.getByText('OBJECTIVES')).toBeInTheDocument();
    });

    it('VALID: {label: "STEPS", count: 5} => renders label with count', () => {
      SectionHeaderWidgetProxy();
      const label = SectionLabelStub({ value: 'STEPS' });
      const count = SectionCountStub({ value: 5 });

      mantineRenderAdapter({ ui: <SectionHeaderWidget label={label} count={count} /> });

      expect(screen.getByText('STEPS')).toBeInTheDocument();

      const countElement = screen.getByTestId('SECTION_HEADER_COUNT');

      expect(countElement.textContent).toBe('(5)');
    });

    it('VALID: {count: 0} => renders count of zero', () => {
      SectionHeaderWidgetProxy();
      const label = SectionLabelStub({ value: 'ITEMS' });
      const count = SectionCountStub({ value: 0 });

      mantineRenderAdapter({ ui: <SectionHeaderWidget label={label} count={count} /> });

      const countElement = screen.getByTestId('SECTION_HEADER_COUNT');

      expect(countElement.textContent).toBe('(0)');
    });
  });

  describe('without count', () => {
    it('VALID: {no count} => does not render count element', () => {
      SectionHeaderWidgetProxy();
      const label = SectionLabelStub({ value: 'HEADER' });

      mantineRenderAdapter({ ui: <SectionHeaderWidget label={label} /> });

      expect(screen.queryByTestId('SECTION_HEADER_COUNT')).toBeNull();
    });
  });
});

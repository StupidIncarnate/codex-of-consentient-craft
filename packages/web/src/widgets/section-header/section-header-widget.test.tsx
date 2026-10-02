import { render, screen } from '#gateway/npm/testing-library__react';

import { SectionHeaderWidget } from './section-header-widget';
import { SectionHeaderWidgetProxy } from './section-header-widget.proxy';

describe('SectionHeaderWidget', () => {
  describe('rendering', () => {
    it('VALID: {label: "OBJECTIVES"} => renders label text', () => {
      SectionHeaderWidgetProxy();
      const label = 'OBJECTIVES';

      render({ ui: <SectionHeaderWidget label={label} /> });

      expect(screen.getByTestId('SECTION_HEADER_LABEL').textContent).toBe('OBJECTIVES');
    });

    it('VALID: {label: "STEPS", count: 5} => renders label with count', () => {
      SectionHeaderWidgetProxy();
      const label = 'STEPS';
      const count = 5;

      render({ ui: <SectionHeaderWidget label={label} count={count} /> });

      expect(screen.getByTestId('SECTION_HEADER_LABEL').textContent).toBe('STEPS');

      const countElement = screen.getByTestId('SECTION_HEADER_COUNT');

      expect(countElement.textContent).toBe('(5)');
    });

    it('VALID: {count: 0} => renders count of zero', () => {
      SectionHeaderWidgetProxy();
      const label = 'ITEMS';
      const count = 0;

      render({ ui: <SectionHeaderWidget label={label} count={count} /> });

      const countElement = screen.getByTestId('SECTION_HEADER_COUNT');

      expect(countElement.textContent).toBe('(0)');
    });
  });

  describe('without count', () => {
    it('VALID: {no count} => does not render count element', () => {
      SectionHeaderWidgetProxy();
      const label = 'HEADER';

      render({ ui: <SectionHeaderWidget label={label} /> });

      expect(screen.queryByTestId('SECTION_HEADER_COUNT')).toBe(null);
    });
  });
});

import { screen } from '#gateway/npm/testing-library__react';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { SectionLabelStub } from '../../contracts/section-label/section-label.stub';
import { PlanSectionWidget } from './plan-section-widget';
import { PlanSectionWidgetProxy } from './plan-section-widget.proxy';

const renderItem = (item: string): React.JSX.Element => <span data-testid="PLAN_ITEM">{item}</span>;

describe('PlanSectionWidget', () => {
  describe('rendering', () => {
    it('VALID: {title: "STEPS", items: [step-a, step-b]} => renders section header', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = 'step-a';
      const itemB = 'step-b';

      mantineRenderMiddleware({
        ui: <PlanSectionWidget title={title} items={[itemA, itemB]} renderItem={renderItem} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_LABEL')).toBeInTheDocument();
    });

    it('VALID: {items: [step-a, step-b]} => renders all items', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = 'step-a';
      const itemB = 'step-b';

      mantineRenderMiddleware({
        ui: <PlanSectionWidget title={title} items={[itemA, itemB]} renderItem={renderItem} />,
      });

      const renderedItems = screen.getAllByTestId('PLAN_ITEM');
      const itemTexts = renderedItems.map((el) => el.textContent);

      expect(itemTexts).toStrictEqual(['step-a', 'step-b']);
    });

    it('EMPTY: {items: []} => renders section with count zero', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const items: string[] = [];

      mantineRenderMiddleware({
        ui: <PlanSectionWidget title={title} items={items} renderItem={renderItem} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_COUNT').textContent).toBe('(0)');
    });
  });

  describe('no edit affordances', () => {
    it('VALID: {items: [item]} => renders no add or remove buttons', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = 'step-a';

      mantineRenderMiddleware({
        ui: <PlanSectionWidget title={title} items={[itemA]} renderItem={renderItem} />,
      });

      expect(screen.queryAllByTestId('PIXEL_BTN')).toStrictEqual([]);
    });
  });
});

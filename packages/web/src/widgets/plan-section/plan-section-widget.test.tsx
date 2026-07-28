import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { PlanSectionTestItemStub } from '../../contracts/plan-section-test-item/plan-section-test-item.stub';
import { SectionLabelStub } from '../../contracts/section-label/section-label.stub';
import { PlanSectionWidget } from './plan-section-widget';
import { PlanSectionWidgetProxy } from './plan-section-widget.proxy';

type TestItem = ReturnType<typeof PlanSectionTestItemStub>;

const renderItem = (item: TestItem): React.JSX.Element => (
  <span data-testid="PLAN_ITEM">{item.text}</span>
);

describe('PlanSectionWidget', () => {
  describe('rendering', () => {
    it('VALID: {title: "STEPS", items: [step-a, step-b]} => renders section header', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });
      const itemB = PlanSectionTestItemStub({ text: 'step-b' });

      mantineRenderAdapter({
        ui: <PlanSectionWidget title={title} items={[itemA, itemB]} renderItem={renderItem} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_LABEL')).toBeInTheDocument();
    });

    it('VALID: {items: [step-a, step-b]} => renders all items', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });
      const itemB = PlanSectionTestItemStub({ text: 'step-b' });

      mantineRenderAdapter({
        ui: <PlanSectionWidget title={title} items={[itemA, itemB]} renderItem={renderItem} />,
      });

      const renderedItems = screen.getAllByTestId('PLAN_ITEM');
      const itemTexts = renderedItems.map((el) => el.textContent);

      expect(itemTexts).toStrictEqual(['step-a', 'step-b']);
    });

    it('EMPTY: {items: []} => renders section with count zero', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const items: TestItem[] = [];

      mantineRenderAdapter({
        ui: <PlanSectionWidget title={title} items={items} renderItem={renderItem} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_COUNT').textContent).toBe('(0)');
    });
  });

  describe('no edit affordances', () => {
    it('VALID: {items: [item]} => renders no add or remove buttons', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });

      mantineRenderAdapter({
        ui: <PlanSectionWidget title={title} items={[itemA]} renderItem={renderItem} />,
      });

      expect(screen.queryAllByTestId('PIXEL_BTN')).toStrictEqual([]);
    });
  });
});

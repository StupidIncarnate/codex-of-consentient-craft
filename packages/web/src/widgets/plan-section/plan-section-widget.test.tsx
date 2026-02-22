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

      expect(screen.getByText('STEPS')).toBeInTheDocument();
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

  describe('editing mode', () => {
    it('VALID: {editing: true, onAdd} => renders add button', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <PlanSectionWidget
            title={title}
            items={[itemA]}
            renderItem={renderItem}
            editing={true}
            onAdd={onAdd}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const addButton = buttons.find((button) => button.textContent === '+');

      expect(addButton).toBeInTheDocument();
    });

    it('VALID: {editing: true, onAdd, click add} => calls onAdd', async () => {
      const proxy = PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <PlanSectionWidget
            title={title}
            items={[itemA]}
            renderItem={renderItem}
            editing={true}
            onAdd={onAdd}
          />
        ),
      });

      await proxy.clickAdd();

      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('VALID: {editing: true, onRemove} => renders remove buttons', () => {
      PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });
      const itemB = PlanSectionTestItemStub({ text: 'step-b' });
      const onRemove = jest.fn();

      mantineRenderAdapter({
        ui: (
          <PlanSectionWidget
            title={title}
            items={[itemA, itemB]}
            renderItem={renderItem}
            editing={true}
            onRemove={onRemove}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const removeButtons = buttons.filter((button) => button.textContent === 'x');

      expect(removeButtons).toHaveLength(2);
    });

    it('VALID: {editing: true, onRemove, click remove} => calls onRemove with index', async () => {
      const proxy = PlanSectionWidgetProxy();
      const title = SectionLabelStub({ value: 'STEPS' });
      const itemA = PlanSectionTestItemStub({ text: 'step-a' });
      const itemB = PlanSectionTestItemStub({ text: 'step-b' });
      const onRemove = jest.fn();

      mantineRenderAdapter({
        ui: (
          <PlanSectionWidget
            title={title}
            items={[itemA, itemB]}
            renderItem={renderItem}
            editing={true}
            onRemove={onRemove}
          />
        ),
      });

      await proxy.clickRemove({ index: 1 });

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith(1);
    });
  });

  describe('non-editing mode', () => {
    it('VALID: {editing not set} => does not render add or remove buttons', () => {
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

import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SectionLabelStub } from '../../contracts/section-label/section-label.stub';
import { TagItemStub } from '../../contracts/tag-item/tag-item.stub';
import { FormTagListWidget } from './form-tag-list-widget';
import { FormTagListWidgetProxy } from './form-tag-list-widget.proxy';

describe('FormTagListWidget', () => {
  describe('rendering with items', () => {
    it('VALID: {label: "Tags", items: ["alpha","beta"]} => renders label text', () => {
      FormTagListWidgetProxy();
      const label = SectionLabelStub({ value: 'Tags' });
      const items = [TagItemStub({ value: 'alpha' }), TagItemStub({ value: 'beta' })];

      mantineRenderAdapter({ ui: <FormTagListWidget label={label} items={items} /> });

      expect(screen.getByText('Tags:')).toBeInTheDocument();
    });

    it('VALID: {items: ["alpha","beta"]} => renders all tag items', () => {
      FormTagListWidgetProxy();
      const label = SectionLabelStub({ value: 'Tags' });
      const items = [TagItemStub({ value: 'alpha' }), TagItemStub({ value: 'beta' })];

      mantineRenderAdapter({ ui: <FormTagListWidget label={label} items={items} /> });

      const tagItems = screen.getAllByTestId('FORM_TAG_ITEM');
      const tagTexts = tagItems.map((el) => el.textContent);

      expect(tagTexts).toStrictEqual(['alpha', 'beta']);
    });

    it('VALID: {items: ["alpha","beta"]} => does not render empty text', () => {
      FormTagListWidgetProxy();
      const label = SectionLabelStub({ value: 'Tags' });
      const items = [TagItemStub({ value: 'alpha' }), TagItemStub({ value: 'beta' })];

      mantineRenderAdapter({ ui: <FormTagListWidget label={label} items={items} /> });

      expect(screen.queryByTestId('FORM_TAG_EMPTY')).toBeNull();
    });
  });

  describe('rendering empty', () => {
    it('EMPTY: {items: []} => renders "none" text', () => {
      FormTagListWidgetProxy();
      const label = SectionLabelStub({ value: 'Tags' });
      const items: ReturnType<typeof TagItemStub>[] = [];

      mantineRenderAdapter({ ui: <FormTagListWidget label={label} items={items} /> });

      const emptyText = screen.getByTestId('FORM_TAG_EMPTY');

      expect(emptyText.textContent).toBe('none');
    });

    it('EMPTY: {items: []} => does not render any tag items', () => {
      FormTagListWidgetProxy();
      const label = SectionLabelStub({ value: 'Tags' });
      const items: ReturnType<typeof TagItemStub>[] = [];

      mantineRenderAdapter({ ui: <FormTagListWidget label={label} items={items} /> });

      expect(screen.queryAllByTestId('FORM_TAG_ITEM')).toStrictEqual([]);
    });
  });
});

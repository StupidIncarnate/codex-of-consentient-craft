import { fireEvent, screen } from '@testing-library/react';

export const UserRequestLayerWidgetProxy = (): {
  getChildTestIds: () => readonly ReturnType<Element['getAttribute']>[];
  getChildTagNames: () => readonly Element['tagName'][];
  getRequestText: () => NonNullable<HTMLElement['textContent']>;
  getImageSrcs: () => readonly HTMLImageElement['src'][];
  getImageMaxHeight: (params: { index: number }) => HTMLElement['style']['maxHeight'];
  getImageDisplay: (params: { index: number }) => HTMLElement['style']['display'];
  failImage: (params: { index: number }) => void;
  getBrokenPlaceholderLabels: () => readonly ReturnType<Element['getAttribute']>[];
  getBrokenPlaceholderPaint: () => {
    width: HTMLElement['style']['width'];
    height: HTMLElement['style']['height'];
    borderColor: HTMLElement['style']['borderColor'];
  };
} => ({
  getChildTestIds: (): readonly ReturnType<Element['getAttribute']>[] =>
    Array.from(screen.getByTestId('USER_REQUEST_TEXT').children).map((child) =>
      child.getAttribute('data-testid'),
    ),
  getChildTagNames: (): readonly Element['tagName'][] =>
    Array.from(screen.getByTestId('USER_REQUEST_TEXT').children).map((child) => child.tagName),
  // The block's own textContent already excludes every img and broken-placeholder span — neither
  // carries a text node — so this IS "the request with every image stripped", with no stripping.
  getRequestText: (): NonNullable<HTMLElement['textContent']> =>
    screen.getByTestId('USER_REQUEST_TEXT').textContent ?? '',
  // getAttribute, not the `.src` IDL property: jsdom resolves `.src` against the document's base
  // URL, so a root-relative path would come back as an absolute one and the assertion would be
  // about jsdom rather than about the widget.
  getImageSrcs: (): readonly HTMLImageElement['src'][] =>
    screen.queryAllByTestId('USER_REQUEST_IMAGE').map((image) => image.getAttribute('src') ?? ''),
  getImageMaxHeight: ({ index }): HTMLElement['style']['maxHeight'] => {
    const image = screen.getAllByTestId('USER_REQUEST_IMAGE')[index];
    if (image === undefined) {
      throw new Error(`no USER_REQUEST_IMAGE was rendered at index ${String(index)}`);
    }
    return image.style.maxHeight;
  },
  getImageDisplay: ({ index }): HTMLElement['style']['display'] => {
    const image = screen.getAllByTestId('USER_REQUEST_IMAGE')[index];
    if (image === undefined) {
      throw new Error(`no USER_REQUEST_IMAGE was rendered at index ${String(index)}`);
    }
    return image.style.display;
  },
  // A real `error` event, not userEvent (which has no equivalent) — it does not bubble the way a
  // click does, so it is fired directly on the image element.
  failImage: ({ index }): void => {
    const image = screen.getAllByTestId('USER_REQUEST_IMAGE')[index];
    if (image === undefined) {
      throw new Error(`no USER_REQUEST_IMAGE was rendered at index ${String(index)}`);
    }
    fireEvent.error(image);
  },
  // The LABELS rather than a tally: they name which ordinal failed, so an assertion over them says
  // both how many boxes there are and which image each one stands in for.
  getBrokenPlaceholderLabels: (): readonly ReturnType<Element['getAttribute']>[] =>
    screen
      .queryAllByTestId('USER_REQUEST_IMAGE_BROKEN')
      .map((placeholder) => placeholder.getAttribute('aria-label')),
  getBrokenPlaceholderPaint: (): {
    width: HTMLElement['style']['width'];
    height: HTMLElement['style']['height'];
    borderColor: HTMLElement['style']['borderColor'];
  } => {
    const placeholder = screen.getByTestId('USER_REQUEST_IMAGE_BROKEN');
    return {
      width: placeholder.style.width,
      height: placeholder.style.height,
      borderColor: placeholder.style.borderColor,
    };
  },
});

/**
 * PURPOSE: A real `ReactElement`, built by actually calling `createElement()` on a real tabler
 * icon component (`IconSend`, already used in production — `comment-queue-bar-widget`) — for a
 * caller staging this subpath's own value instead of hand-typing a fake icon element.
 *
 * USAGE:
 * const icon = IconElementStub();
 * // Returns a real ReactElement for the IconSend component
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { IconSend } from '@tabler/icons-react';

export const IconElementStub = (): ReactElement => createElement(IconSend);

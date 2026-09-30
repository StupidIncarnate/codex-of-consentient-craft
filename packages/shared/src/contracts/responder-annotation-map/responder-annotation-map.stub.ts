/**
 * PURPOSE: Stub factory for ResponderAnnotationMap contract
 *
 * USAGE:
 * const map = ResponderAnnotationMapStub({ entries: [[filePath, annotation]] });
 * // Returns a validated empty Map by default, or a Map populated from entries
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import type { ResponderAnnotation } from '../responder-annotation/responder-annotation-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from './responder-annotation-map-contract';
import { ResponderAnnotationStub } from '../responder-annotation/responder-annotation.stub';

type Entry = readonly [string, ResponderAnnotation];

interface StubProps {
  entries: readonly Entry[];
}

export const ResponderAnnotationMapStub = ({
  ...props
}: StubArgument<StubProps> = {}): ResponderAnnotationMap => {
  const rawEntries = props.entries ?? [];
  const initial = new Map<string, ResponderAnnotation>();
  for (const item of rawEntries) {
    if (item === undefined) continue;
    const [key, value] = item;
    if (key === undefined || value === undefined) continue;
    const suffixInput = value.suffix;
    initial.set(
      key,
      ResponderAnnotationStub({
        suffix: suffixInput === null || suffixInput === undefined ? null : suffixInput,
        childLines: (value.childLines ?? []).map((line) => line),
      }),
    );
  }
  return responderAnnotationMapContract.parse(initial);
};

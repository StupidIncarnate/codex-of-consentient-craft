/**
 * PURPOSE: Stub factory for ResponderAnnotation contract
 *
 * USAGE:
 * const ann = ResponderAnnotationStub({ suffix: ContentTextStub({ value: '[POST /api/x]' }) });
 * // Returns a validated ResponderAnnotation with empty childLines by default
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import {
  responderAnnotationContract,
  type ResponderAnnotation,
} from './responder-annotation-contract';

export const ResponderAnnotationStub = ({
  ...props
}: StubArgument<ResponderAnnotation> = {}): ResponderAnnotation =>
  responderAnnotationContract.parse({
    suffix: null,
    childLines: [],
    ...props,
  });

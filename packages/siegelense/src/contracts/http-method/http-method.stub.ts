import type { z } from 'zod';

import { httpMethodContract } from './http-method-contract';
import type { HttpMethod } from './http-method-contract';

type HttpMethodInput = z.input<typeof httpMethodContract>;

export const HttpMethodStub = ({ value }: { value?: HttpMethodInput } = {}): HttpMethod =>
  httpMethodContract.parse(value ?? 'GET');

import { urlPathContract } from './url-path-contract';
import type { UrlPath } from './url-path-contract';

export const UrlPathStub = ({ value }: { value: string } = { value: '/api/guilds' }): UrlPath =>
  urlPathContract.parse(value);

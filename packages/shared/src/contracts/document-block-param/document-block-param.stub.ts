import type { StubArgument } from '@dungeonmaster/shared/@types';

import { documentBlockParamContract } from './document-block-param-contract';
import type { DocumentBlockParam } from './document-block-param-contract';

/**
 * Base64-encoded PDF document block — used when the assistant receives a PDF as
 * inline base64 data.
 */
export const Base64DocumentBlockParamStub = ({
  ...props
}: StubArgument<DocumentBlockParam> = {}): DocumentBlockParam =>
  documentBlockParamContract.parse({
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: 'JVBERi0xLjQKJeLjz9MKCg==',
    },
    ...props,
  });

/**
 * Plain text document block — used when the assistant receives text content as
 * a document for analysis or reference.
 */
export const PlainTextDocumentBlockParamStub = ({
  ...props
}: StubArgument<DocumentBlockParam> = {}): DocumentBlockParam =>
  documentBlockParamContract.parse({
    type: 'document',
    source: {
      type: 'text',
      media_type: 'text/plain',
      data: 'This is a plain text document.',
    },
    ...props,
  });

/**
 * URL-referenced PDF document block — used when the assistant references a PDF
 * at a remote URL rather than inline data.
 */
export const UrlDocumentBlockParamStub = ({
  ...props
}: StubArgument<DocumentBlockParam> = {}): DocumentBlockParam =>
  documentBlockParamContract.parse({
    type: 'document',
    source: {
      type: 'url',
      url: 'https://example.com/report.pdf',
    },
    ...props,
  });

/**
 * Content-block document — used when the assistant receives a document whose
 * content is expressed as a string or an array of text blocks.
 */
export const ContentDocumentBlockParamStub = ({
  ...props
}: StubArgument<DocumentBlockParam> = {}): DocumentBlockParam =>
  documentBlockParamContract.parse({
    type: 'document',
    source: {
      type: 'content',
      content: 'Document content as a plain string.',
    },
    ...props,
  });

/**
 * PURPOSE: Defines the Anthropic SDK DocumentBlockParam shape with base64/text/url/content source variants
 *
 * USAGE:
 * documentBlockParamContract.parse({ type: 'document', source: { type: 'url', url: 'https://example.com/doc.pdf' } });
 * // Returns: DocumentBlockParam with discriminated source union
 */

import { z } from 'zod';

import { textBlockParamContract } from '../text-block-param/text-block-param-contract';
import { imageBlockParamContract } from '../image-block-param/image-block-param-contract';

const base64PdfSourceContract = z.object({
  type: z.literal('base64'),
  media_type: z.literal('application/pdf').brand<'PdfMediaType'>(),
  data: z.string().brand<'Base64Data'>(),
});

const plainTextSourceContract = z.object({
  type: z.literal('text'),
  media_type: z.literal('text/plain').brand<'PlainTextMediaType'>(),
  data: z.string().brand<'PlainTextData'>(),
});

const urlPdfSourceContract = z.object({
  type: z.literal('url'),
  url: z.string().brand<'DocumentUrl'>(),
});

const contentBlockSourceContract = z.object({
  type: z.literal('content'),
  content: z.union([
    z.string().brand<'DocumentContent'>(),
    z.array(textBlockParamContract),
    z.array(imageBlockParamContract),
  ]),
});

export const documentBlockParamContract = z.object({
  type: z.literal('document'),
  source: z.discriminatedUnion('type', [
    base64PdfSourceContract,
    plainTextSourceContract,
    urlPdfSourceContract,
    contentBlockSourceContract,
  ]),
  title: z.string().brand<'DocumentTitle'>().nullable().optional(),
  context: z.string().brand<'DocumentContext'>().nullable().optional(),
});

export type DocumentBlockParam = z.infer<typeof documentBlockParamContract>;

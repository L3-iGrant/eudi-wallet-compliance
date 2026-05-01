declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PageData {
    getTextContent(options?: {
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }): Promise<{ items: Array<{ str: string }> }>;
  }

  interface PdfParseOptions {
    pagerender?: (pageData: PageData) => string | Promise<string>;
    max?: number;
    version?: string;
  }

  interface PdfParseResult {
    text: string;
    numpages: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }

  const pdfParse: (
    buffer: Buffer | Uint8Array,
    options?: PdfParseOptions,
  ) => Promise<PdfParseResult>;

  export default pdfParse;
}

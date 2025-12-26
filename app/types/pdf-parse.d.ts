declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
    version: string;
    text: string;
  }

  interface PDFParseOptions {
    pageNumbers?: number[];
    max?: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PDFParseOptions
  ): Promise<PDFData>;

  export = pdfParse;
}

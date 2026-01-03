import { ReadableStream } from "node:stream/web";

/**
 * Converts a PDFKit document into a web ReadableStream suitable for NextResponse.
 */
export function pdfKitToReadableStream(
  doc: PDFKit.PDFDocument
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      doc.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      doc.on("end", () => controller.close());
      doc.on("error", (err: unknown) => controller.error(err));
    },
  });
}

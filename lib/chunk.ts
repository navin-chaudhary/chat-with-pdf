/**
 * Splits text into overlapping windows (~800 chars) so long PDFs fit in context.
 */
export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 150,
): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= chunkSize) return cleaned ? [cleaned] : [];

  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + chunkSize, cleaned.length);
    let slice = cleaned.slice(i, end);
    if (end < cleaned.length) {
      const lastSpace = slice.lastIndexOf(" ");
      if (lastSpace > chunkSize * 0.5) slice = slice.slice(0, lastSpace);
    }
    if (slice.length > 40) chunks.push(slice.trim());
    i += Math.max(slice.length - overlap, 1);
  }
  return chunks;
}

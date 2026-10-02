/** Triggers a browser file download from a Blob (used for report exports). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Extracts filename from a Content-Disposition header, falling back to a default. */
export function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = header.match(/filename="?([^"]+)"?/);
  return match?.[1] || fallback;
}

// Phân tích và render URL ảnh từ hentaifox

export interface ParsedUrl {
  prefix: string;      // Phần trước số trang (VD: "https://i3.hentaifox.com/004/4029076/")
  pageNumber: number;  // Số trang gốc
  suffix: string;      // Hậu tố sau số trang (VD: "t")
  extension: string;   // Phần mở rộng (VD: "jpg")
  galleryId: string;   // ID gallery (VD: "4029076")
}

/**
 * Phân tích URL hentaifox thành các thành phần
 * VD: "https://i3.hentaifox.com/004/4029076/1t.jpg"
 */
export function parseHentaifoxUrl(url: string): ParsedUrl | null {
  // Pattern: .../{gallery_id}/{page_num}{suffix}.{ext}
  const match = url.match(/^(.*\/)(\d+)([a-zA-Z]*)\.(\w+)$/);
  if (!match) return null;

  const prefix = match[1];
  const pageNumber = parseInt(match[2], 10);
  const suffix = match[3];
  const extension = match[4];

  // Trích xuất gallery_id từ prefix (phần số cuối cùng trước dấu /)
  const galleryMatch = prefix.match(/\/(\d+)\/$/);
  const galleryId = galleryMatch ? galleryMatch[1] : '';

  return { prefix, pageNumber, suffix, extension, galleryId };
}

/**
 * Sinh danh sách URL ảnh từ base_url + total_pages
 * VD: base_url = "https://i3.hentaifox.com/004/4029076/1t.jpg", total_pages = 25
 * → ["...1t.jpg", "...2t.jpg", ..., "...25t.jpg"]
 */
export function generatePageUrls(baseUrl: string, totalPages: number): string[] {
  const parsed = parseHentaifoxUrl(baseUrl);
  if (!parsed) {
    return Array.from({ length: totalPages }, () => baseUrl);
  }

  return Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    return `${parsed.prefix}${pageNum}${parsed.suffix}.${parsed.extension}`;
  });
}

/**
 * Trích xuất gallery_id từ URL (dùng để đặt tên cover image)
 */
export function extractGalleryId(url: string): string | null {
  const parsed = parseHentaifoxUrl(url);
  return parsed ? parsed.galleryId : null;
}

const cache = new WeakMap<Blob, string>();

export function getCachedBlobUrl(blob: Blob): string {
  let url = cache.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    cache.set(blob, url);
  }
  return url;
}

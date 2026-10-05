type ObjectUrlApi = Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;

/** Tracks every preview URL created for a session and gives each URL one clear owner. */
export class PhotoObjectUrlRegistry {
  private readonly urls = new Set<string>();

  constructor(private readonly api: ObjectUrlApi = URL) {}

  create(blob: Blob): string {
    const url = this.api.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  release(url: string): void {
    if (!this.urls.delete(url)) return;
    this.api.revokeObjectURL(url);
  }

  releaseUnused(activeUrls: ReadonlySet<string>): void {
    [...this.urls].forEach((url) => { if (!activeUrls.has(url)) this.release(url); });
  }

  dispose(): void {
    [...this.urls].forEach((url) => this.release(url));
  }

  get size(): number {
    return this.urls.size;
  }
}

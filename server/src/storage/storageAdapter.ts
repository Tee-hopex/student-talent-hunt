export interface SavedFile {
  /** Opaque key the adapter uses to locate the file again (path, S3 key, etc). */
  key: string;
  /** Bytes actually written to the backing store (post-encryption, if applicable). */
  size: number;
}

export interface StorageAdapter {
  /** Persists a buffer under a namespaced key and returns where it landed. */
  save(namespace: string, filename: string, data: Buffer): Promise<SavedFile>;
  /** Reads a previously saved file back into memory. */
  read(key: string): Promise<Buffer>;
  /** Removes a file. No-ops if it doesn't exist. */
  remove(key: string): Promise<void>;
}

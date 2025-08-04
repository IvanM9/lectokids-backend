export interface StorageUploadResult {
  url: string;
  fileName: string;
}

export interface StorageDownloadResult {
  buffer: Buffer;
  name: string;
}

export interface StorageProvider {
  /**
   * Upload a file to the storage provider
   * @param filePath - Local path to the file
   * @param fileName - Name to store the file as
   * @param makePublic - Whether to make the file publicly accessible
   * @returns Upload result with URL and filename
   */
  uploadFile(
    filePath: string,
    fileName: string,
    makePublic?: boolean,
  ): Promise<StorageUploadResult>;

  /**
   * Download a file from the storage provider
   * @param fileName - Name of the file to download
   * @returns Download result with buffer and name
   */
  downloadFile(fileName: string): Promise<StorageDownloadResult>;

  /**
   * Delete a file from the storage provider
   * @param fileName - Name of the file to delete
   */
  deleteFile(fileName: string): Promise<void>;
}

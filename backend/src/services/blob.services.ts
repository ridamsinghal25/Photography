import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { blobServiceClient, sharedKeyCredential } from "../lib/azureBlob";
import { config } from "../config/app.config";
import { BlobFolder } from "../enums/enum";

class BlobService {
  private container = blobServiceClient.getContainerClient(
    config.AZURE_STORAGE_CONTAINER_NAME
  );

  // Returns a SAS URL the frontend can PUT to directly
  generateUploadSasUrl(blobName: string, expiresInMinutes = 10): string {
    const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: config.AZURE_STORAGE_CONTAINER_NAME,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        expiresOn,
      },
      sharedKeyCredential
    ).toString();
    return `${this.container.getBlobClient(blobName).url}?${sasToken}`;
  }

  // Backend upload — used after sharp compression
  async uploadBuffer(
    blobName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const blockBlob = this.container.getBlockBlobClient(blobName);
    await blockBlob.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlob.url;
  }

  async downloadBuffer(blobName: string): Promise<Buffer> {
    const download = await this.container.getBlobClient(blobName).download();

    const chunks: Buffer[] = [];
    
    for await (const chunk of download.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  // Deletes both original and compressed blobs for a given userId + storedFileName
  async deletePhoto(userId: string, storedFileName: string): Promise<void> {
    try {
      await Promise.all([
      this.container.deleteBlob(`${userId}/${BlobFolder.Original}/${storedFileName}`),
        this.container.deleteBlob(`${userId}/${BlobFolder.Compressed}/${storedFileName}`),
      ]);
    } catch (error) {
      console.error(`Error deleting photo ${storedFileName} for user ${userId}:`, error);
    }
  }
}

export default new BlobService();

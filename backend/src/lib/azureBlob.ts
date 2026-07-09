import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { config } from "../config/app.config";


function parseConnectionString(connStr: string) {
  const map: Record<string, string> = {};
  for (const part of connStr.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) map[part.slice(0, idx)] = part.slice(idx + 1);
  }
  return { accountName: map.AccountName, accountKey: map.AccountKey };
}

const { accountName, accountKey } = parseConnectionString(
  config.AZURE_STORAGE_CONNECTION_STRING
);

export const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

export const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

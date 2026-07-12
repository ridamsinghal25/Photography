import { useState } from "react";
import BlobService from "@/services/BlobService";
import { isApiError } from "@/lib/typeGuard";
import type { BlobData } from "@/types/photo";

export function useUploadBlob() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<BlobData> => {
    setUploading(true);
    try {
      const res = await BlobService.getUploadSasUrl<{
        sasUrl: string;
        storedFileName: string;
      }>(file.type);

      if (isApiError(res)) throw new Error(res.errorMessage);

      const { sasUrl, storedFileName } = res.data!;

      const put = await fetch(sasUrl, {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": file.type },
        body: file,
      });

      if (!put.ok) throw new Error("Storage upload failed");

      return {
        storedFileName,
        originalUrl: sasUrl.split("?")[0],
        originalFileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      };
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}

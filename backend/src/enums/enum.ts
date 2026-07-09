export enum NodeEnv {
  Development = "development",
  Production = "production",
}

export enum BlobFolder {
  Original = "original",
  Compressed = "compressed",
}

export enum ImageMimeType {
  Jpg = "image/jpg",
  Png = "image/png",
  Webp = "image/webp",
  Tiff = "image/tiff",
  Avif = "image/avif",
  Heic = "image/heic",
  Heif = "image/heif",
  HeicSequence = "image/heic-sequence",
  HeifSequence = "image/heif-sequence",
}

export const IMAGE_MIME_TO_EXT: Record<ImageMimeType, string> = {
  [ImageMimeType.Jpg]: ".jpg",
  [ImageMimeType.Png]: ".png",
  [ImageMimeType.Webp]: ".webp",
  [ImageMimeType.Tiff]: ".tif",
  [ImageMimeType.Avif]: ".avif",
  [ImageMimeType.Heic]: ".heic",
  [ImageMimeType.Heif]: ".heif",
  [ImageMimeType.HeicSequence]: ".heic",
  [ImageMimeType.HeifSequence]: ".heif",
};
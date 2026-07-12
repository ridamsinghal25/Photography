export type Meta = {
  slug: string;
  subjectId: string;
  cameraBody: string;
  lens: string;
  aperture: string;
  iso: string;
  shutterSpeed: string;
  place: string;
  city: string;
  capturedDate: string;
  capturedTime: string;
  caption: string;
};

export type BlobData = {
  storedFileName: string;
  originalUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
};

export type PhotoData = {
  id: string;
  slug: string;
  compressedUrl: string | null;
  originalUrl: string;
  subjectId: string | null;
  cameraBody: string | null;
  lens: string | null;
  aperture: string | null;
  iso: string | null;
  shutterSpeed: string | null;
  place: string | null;
  city: string | null;
  capturedDate: string | null;
  capturedTime: string | null;
  caption: string | null;
};

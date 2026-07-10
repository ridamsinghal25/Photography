"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LuDownload as Download } from "react-icons/lu";
import PhotoService from "@/services/PhotoService";
import { isApiError } from "@/lib/typeGuard";
import { Button } from "@/components/ui/button";

type Photo = { id: string; compressedUrl: string | null; userPhotoNumber: number };

const COLUMN_COUNT = 4;

function distributePhotos(photos: Photo[]): Photo[][] {
  const columns: Photo[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  photos.forEach((photo, i) => columns[i % COLUMN_COUNT].push(photo));
  return columns;
}

type PhotosResponse = {
  photos: Photo[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const LIMIT = 20;

export default function ImageGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");


  const loadPhotos = async (p: number) => {
    setLoading(true);
    const res = await PhotoService.getPhotos<PhotosResponse>(id, p, LIMIT);
    setLoading(false);
    if (isApiError(res)) {
      setError(res.errorMessage);
      return;
    }
    const data = res.data?.photos ?? [];
    setPhotos((prev) => (p === 1 ? data : [...prev, ...data]));
    if (data.length < LIMIT) setHasMore(false);
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPhotos([]);
    loadPhotos(1);
  }, [id]);


  return (
    <div className="min-h-screen px-6 py-10 flex flex-col items-center gap-8">
      {error && <p className="text-red-400">{error}</p>}

      <div className="w-full max-w-7xl grid grid-cols-2 gap-4 md:grid-cols-4 items-start">
        {distributePhotos(photos)
          .filter((columnPhotos) => columnPhotos.length > 0)
          .map((columnPhotos, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4">
            {columnPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => router.push(`/photo/${photo.id}`)}
                className="group relative w-full rounded-lg overflow-hidden cursor-pointer shadow-[1px_2px_40px_8px_rgba(0,0,0,0.4)] transition-shadow duration-300 hover:shadow-[1px_2px_40px_8px_rgba(0,0,0,0.6)]"
              >
                <img
                  src={photo.compressedUrl ?? ""}
                  alt={`Photo ${photo.userPhotoNumber}`}
                  loading="lazy"
                  className="block w-full h-auto"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm flex flex-col justify-end gap-2 p-4">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2 text-white text-sm font-semibold">
                      <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {photo.userPhotoNumber}
                      </span>
                      Photo #{photo.userPhotoNumber}
                    </span>
                    <a
                      href={photo.compressedUrl ?? "#"}
                      download="photo.jpg"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white hover:text-indigo-300 transition-colors"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {photos.length === 0 && !loading && (
        <p className="text-zinc-400">No photos found.</p>
      )}

      {hasMore && (
        <Button
          variant="outline"
          size="lg"
          disabled={loading}
          onClick={() => {
            const next = page + 1;
            setPage(next);
            loadPhotos(next);
          }}
          className="mt-2 text-white border-zinc-600 hover:bg-zinc-800"
        >
          {loading ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { LuUpload as Upload, LuTrash2 as Trash2, LuSave as Save, LuArrowLeft as ArrowLeft } from "react-icons/lu";
import PhotoService from "@/services/PhotoService";
import BlobService from "@/services/BlobService";
import { isApiError } from "@/lib/typeGuard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Meta = {
  // categoryId: string; tags: string;
  subjectName: string; subjectInsta: string;
  cameraBody: string; lens: string; aperture: string; iso: string; shutterSpeed: string;
  place: string; city: string; capturedDate: string; capturedTime: string;
  caption: string;
};

type PhotoData = {
  id: string; // categoryId: string;
  userPhotoNumber: number;
  compressedUrl: string | null; originalUrl: string;
  subjectName: string | null; subjectInsta: string | null;
  cameraBody: string | null; lens: string | null; aperture: string | null;
  iso: string | null; shutterSpeed: string | null;
  place: string | null; city: string | null;
  capturedDate: string | null; capturedTime: string | null;
  caption: string | null;
};

const INPUT = "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors placeholder:text-zinc-400";

async function uploadToBlob(file: File) {
  const res = await BlobService.getUploadSasUrl<{ sasUrl: string; storedFileName: string }>(file.type);
  if (isApiError(res)) throw new Error(res.errorMessage);
  const { sasUrl, storedFileName } = res.data!;
  const put = await fetch(sasUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error("Storage upload failed");
  return { storedFileName, originalUrl: sasUrl.split("?")[0], originalFileName: file.name, mimeType: file.type, fileSize: file.size };
}

function DropZone({ preview, onFile }: { preview: string; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = (f: File) => { if (f.type.startsWith("image/")) onFile(f); };
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
      className={cn(
        "relative w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer overflow-hidden",
        "flex flex-col items-center justify-center gap-2 transition-colors",
        over ? "border-indigo-400 bg-indigo-50"
          : preview ? "border-transparent"
          : "border-zinc-300 bg-zinc-50 hover:border-zinc-400",
      )}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); }} />
      {preview ? (
        <>
          <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">Click to change</span>
          </div>
        </>
      ) : (
        <>
          <Upload className="w-7 h-7 text-zinc-400" />
          <p className="text-sm text-zinc-500">Drop image or <span className="text-indigo-600">browse</span></p>
          <p className="text-xs text-zinc-400">JPEG · PNG · WebP</p>
        </>
      )}
    </div>
  );
}

function UploadForm() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const isEdit = !!id;

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<Meta>();
  const [photoNum, setPhotoNum] = useState<number | null>(null);
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!id) return;
    PhotoService.getPhotoById<PhotoData>(id).then(res => {
      if (isApiError(res)) { setMsg({ text: res.errorMessage, ok: false }); return; }
      const p = res.data!;
      setPhotoNum(p.userPhotoNumber);
      setPreview(p.compressedUrl ?? p.originalUrl);
      reset({
        // categoryId: p.categoryId ?? "",
        // tags: "",
        subjectName: p.subjectName ?? "",
        subjectInsta: p.subjectInsta ?? "",
        cameraBody: p.cameraBody ?? "",
        lens: p.lens ?? "",
        aperture: p.aperture ?? "",
        iso: p.iso ?? "",
        shutterSpeed: p.shutterSpeed ?? "",
        place: p.place ?? "",
        city: p.city ?? "",
        capturedDate: p.capturedDate ? p.capturedDate.split("T")[0] : "",
        capturedTime: p.capturedTime ? p.capturedTime.substring(0, 5) : "",
        caption: p.caption ?? "",
      });
    });
  }, [id, reset]);

  const toBody = (d: Meta) => d;
  // const toBody = (d: Meta) => ({ ...d, tags: d.tags.split(",").map(t => t.trim()).filter(Boolean) });

  const onSubmit = handleSubmit(async (data) => {
    setMsg(null);
    try {
      if (isEdit) {
        const res = await PhotoService.updatePhotoMetadata(id!, toBody(data));
        if (isApiError(res)) throw new Error(res.errorMessage);
        setMsg({ text: "Metadata saved.", ok: true });
      } else {
        if (!file) { setMsg({ text: "Select an image first.", ok: false }); return; }
        const blob = await uploadToBlob(file);
        const res = await PhotoService.createPhoto<PhotoData>({ ...blob, ...toBody(data) });
        if (isApiError(res)) throw new Error(res.errorMessage);
        router.push(`/upload?id=${res.data!.id}`);
      }
    } catch (e: any) {
      setMsg({ text: e.message, ok: false });
    }
  });

  const handleReplaceMedia = async () => {
    if (!mediaFile) return;
    setMsg(null);
    setReplacing(true);
    try {
      const blob = await uploadToBlob(mediaFile);
      const res = await PhotoService.updatePhotoMedia(id!, blob);
      if (isApiError(res)) throw new Error(res.errorMessage);
      setPreview(mediaPreview);
      setMediaFile(null);
      setMediaPreview("");
      setMsg({ text: "Image replaced.", ok: true });
    } catch (e: any) {
      setMsg({ text: e.message, ok: false });
    } finally {
      setReplacing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setDeleting(true);
    const res = await PhotoService.deletePhoto(id!);
    if (isApiError(res)) { setMsg({ text: res.errorMessage, ok: false }); setDeleting(false); return; }
    router.push("/");
  };

  const busy = isSubmitting || deleting || replacing;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <form onSubmit={onSubmit} className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <button type="button" onClick={() => router.back()}
              className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 -ml-1 rounded-lg hover:bg-zinc-100">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-zinc-900">
              {isEdit ? "Edit Photo" : "Upload Photo"}
            </h1>
            {photoNum && <span className="text-zinc-400 text-sm">#{photoNum}</span>}
          </div>
          {isEdit && (
            <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={handleDelete} className="gap-1.5">
              <Trash2 size={14} />{deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>

        {/* Message banner */}
        {msg && (
          <p className={cn("text-sm px-4 py-3 rounded-xl border", msg.ok
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-600")}>
            {msg.text}
          </p>
        )}

        {/* Image area */}
        {isEdit && preview && (
          <div className="rounded-2xl overflow-hidden aspect-video bg-zinc-100 shadow-sm">
            <img src={preview} alt="Current photo" className="w-full h-full object-cover" />
          </div>
        )}
        {!isEdit && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <p className="text-sm font-medium text-zinc-700">Image</p>
            <DropZone preview={preview} onFile={f => { setFile(f); setPreview(URL.createObjectURL(f)); }} />
          </div>
        )}

        {/* Metadata card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          {isEdit && <p className="text-sm font-medium text-zinc-700">Metadata</p>}

          {/* Classification (FOR FUTURE USE) */}
          {/* <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">Classification</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Category ID *
                <input {...register("categoryId", { required: "Required" })} className={INPUT} placeholder="UUID" />
                {errors.categoryId && <span className="text-red-500 text-xs">{errors.categoryId.message}</span>}
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Tags <span className="font-normal text-zinc-400">(comma-separated UUIDs)</span>
                <input {...register("tags")} className={INPUT} placeholder="uuid1, uuid2" />
              </label>
            </div>
          </div> */}

          {/* Subject */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">Subject</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Name
                <input {...register("subjectName")} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Instagram
                <input {...register("subjectInsta")} className={INPUT} placeholder="@handle" />
              </label>
            </div>
          </div>

          {/* Camera */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">Camera</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Body<input {...register("cameraBody")} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Lens<input {...register("lens")} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Aperture<input {...register("aperture")} className={INPUT} placeholder="f/1.8" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                ISO<input {...register("iso")} className={INPUT} placeholder="400" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Shutter<input {...register("shutterSpeed")} className={INPUT} placeholder="1/250" />
              </label>
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">Location & Time</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Place<input {...register("place")} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                City<input {...register("city")} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Date<input type="date" {...register("capturedDate")} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                Time<input type="time" {...register("capturedTime")} className={INPUT} />
              </label>
            </div>
          </div>

          {/* Caption */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">Caption</p>
            <textarea {...register("caption")} rows={3}
              className={`${INPUT} resize-none`}
              placeholder="Write something about this photo…" />
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <Button type="submit" disabled={busy} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0">
              {isEdit
                ? <>
                  <Save className="w-4 h-4" />{isSubmitting ? "Saving…" : "Save Metadata"}
                </>
                : <>
                  <Upload className="w-4 h-4" />{isSubmitting ? "Uploading…" : "Upload Photo"}
                </>}
            </Button>
          </div>
        </div>

        {/* Replace image (edit only) */}
        {isEdit && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <p className="text-sm font-medium text-zinc-700">Replace Image</p>
            <DropZone preview={mediaPreview} onFile={f => { setMediaFile(f); setMediaPreview(URL.createObjectURL(f)); }} />
            {mediaFile && (
              <div className="flex justify-end">
                <Button type="button" disabled={busy} onClick={handleReplaceMedia} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0">
                  <Upload size={14} />{replacing ? "Uploading…" : "Replace Image"}
                </Button>
              </div>
            )}
          </div>
        )}

      </form>
    </div>
  );
}

export default function UploadPage() {
  return <Suspense><UploadForm /></Suspense>;
}

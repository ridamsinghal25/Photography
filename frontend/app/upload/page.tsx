"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuUpload as Upload,
  LuTrash2 as Trash2,
  LuSave as Save,
  LuArrowLeft as ArrowLeft,
  LuImage as ImageIcon,
  LuCircleAlert as AlertIcon,
  LuCircleCheck as CheckIcon,
} from "react-icons/lu";
import PhotoService from "@/services/PhotoService";
import SubjectService from "@/services/SubjectService";
import { isApiError } from "@/lib/typeGuard";
import { ACCEPTED_MIME_TYPES, ACCEPT_ATTR, MAX_BYTES } from "@/lib/helper";
import { useUploadBlob } from "@/hooks/use-upload-blob";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/subject";
import type { Meta, BlobData, PhotoData } from "@/types/photo";

// ─── Constants ────────────────────────────────────────────────────────────────

const inputStyles =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 " +
  "transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500";

const labelStyles = "text-xs font-semibold text-slate-700";

// ─── Image Picker Component ───────────────────────────────────────────────────

function ImagePicker({
  label,
  fileName,
  onFile,
  disabled,
}: {
  label: string;
  fileName: string;
  onFile: (f: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="gap-2 shrink-0"
      >
        <ImageIcon size={16} />
        {label}
      </Button>
      {fileName && (
        <span className="text-xs text-slate-500 truncate">{fileName}</span>
      )}
    </div>
  );
}

// ─── Status Message Component ─────────────────────────────────────────────────

function StatusMessage({
  message,
  isSuccess,
}: {
  message: string;
  isSuccess: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg border",
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-600"
      )}
    >
      {isSuccess ? (
        <CheckIcon size={16} className="shrink-0" />
      ) : (
        <AlertIcon size={16} className="shrink-0" />
      )}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Upload Form Component ────────────────────────────────────────────────────

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoId = searchParams.get("id");
  const isEditMode = !!photoId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<Meta>();

  const [photoBlob, setPhotoBlob] = useState<BlobData | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementPreviewUrl, setReplacementPreviewUrl] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  const { upload: uploadImage, uploading: isUploading } = useUploadBlob();
  const { upload: uploadReplacement, uploading: isReplacingImage } =
    useUploadBlob();

  const isProcessing =
    isSubmitting || isDeleting || isReplacingImage || isUploading;

  // Load subjects on mount
  useEffect(() => {
    SubjectService.getSubjects<Subject[]>().then((response) => {
      if (!isApiError(response)) {
        setSubjectList(response.data!);
      }
    });
  }, []);

  // Load existing photo in edit mode
  useEffect(() => {
    if (!photoId) return;

    PhotoService.getPhotoById<PhotoData>(photoId).then((response) => {
      if (isApiError(response)) {
        setNotification({ text: response.errorMessage, ok: false });
        return;
      }

      const photoData = response.data!;
      const previewUrl = photoData.compressedUrl ?? photoData.originalUrl;
      setPhotoPreviewUrl(previewUrl);
      setPhotoBlob({
        storedFileName: "",
        originalUrl: photoData.originalUrl,
        originalFileName: "",
        mimeType: "",
        fileSize: 0,
      });

      reset({
        slug: photoData.slug,
        subjectId: photoData.subjectId ?? "",
        cameraBody: photoData.cameraBody ?? "",
        lens: photoData.lens ?? "",
        aperture: photoData.aperture ?? "",
        iso: photoData.iso ?? "",
        shutterSpeed: photoData.shutterSpeed ?? "",
        place: photoData.place ?? "",
        city: photoData.city ?? "",
        capturedDate: photoData.capturedDate
          ? photoData.capturedDate.split("T")[0]
          : "",
        capturedTime: photoData.capturedTime
          ? photoData.capturedTime.substring(0, 5)
          : "",
        caption: photoData.caption ?? "",
      });
    });
  }, [photoId, reset]);

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      return `Unsupported format: ${file.type}`;
    }
    if (file.size > MAX_BYTES) {
      return "File size must be under 10 MB.";
    }
    return null;
  };

  // Handle primary image upload
  const handleImageUpload = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setNotification({ text: validationError, ok: false });
      return;
    }

    setNotification(null);

    try {
      const uploadedBlob = await uploadImage(file);
      setPhotoBlob(uploadedBlob);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    } catch (error: any) {
      setNotification({ text: error.message, ok: false });
    }
  };

  // Handle replacement image selection
  const handleReplacementImageSelect = (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setNotification({ text: validationError, ok: false });
      return;
    }
    setReplacementFile(file);
    setReplacementPreviewUrl(URL.createObjectURL(file));
  };

  // Submit form
  const onFormSubmit = handleSubmit(async (formData) => {
    setNotification(null);

    try {
      if (isEditMode) {
        const updateResponse = await PhotoService.updatePhotoMetadata(
          photoId!,
          formData
        );

        if (isApiError(updateResponse)) {
          throw new Error(updateResponse.errorMessage);
        }

        setNotification({ text: "Metadata saved successfully.", ok: true });
      } else {
        const createResponse = await PhotoService.createPhoto<PhotoData>({
          ...photoBlob!,
          ...formData,
        });

        if (isApiError(createResponse)) {
          throw new Error(createResponse.errorMessage);
        }

        router.push(`/upload?id=${createResponse.data!.id}`);
      }
    } catch (error: any) {
      setNotification({ text: error.message, ok: false });
    }
  });

  // Handle image replacement
  const handleImageReplacement = async () => {
    if (!replacementFile) return;

    setNotification(null);

    try {
      const uploadedBlob = await uploadReplacement(replacementFile);
      const updateResponse = await PhotoService.updatePhotoMedia(
        photoId!,
        uploadedBlob
      );

      if (isApiError(updateResponse)) {
        throw new Error(updateResponse.errorMessage);
      }

      setPhotoPreviewUrl(replacementPreviewUrl);
      setPhotoBlob((prev) => ({
        ...prev!,
        originalUrl: uploadedBlob.originalUrl,
      }));
      setReplacementFile(null);
      setReplacementPreviewUrl("");
      setNotification({ text: "Image replaced successfully.", ok: true });
    } catch (error: any) {
      setNotification({ text: error.message, ok: false });
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async () => {
    if (
      !window.confirm(
        "Are you sure? This action cannot be undone."
      )
    )
      return;

    setIsDeleting(true);

    const deleteResponse = await PhotoService.deletePhoto(photoId!);

    if (isApiError(deleteResponse)) {
      setNotification({ text: deleteResponse.errorMessage, ok: false });
      setIsDeleting(false);
      return;
    }

    router.push("/");
  };

  // Step 1: Image selection (create mode only)
  if (!isEditMode && !photoBlob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-lg p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Upload Photo</h1>
          </div>

          {notification && (
            <StatusMessage
              message={notification.text}
              isSuccess={notification.ok}
            />
          )}

          <ImagePicker
            label={isUploading ? "Uploading…" : "Choose Image"}
            fileName=""
            onFile={handleImageUpload}
            disabled={isUploading}
          />

          <p className="text-xs text-slate-500 text-center">
            Supported: JPEG, PNG, WebP, TIFF, AVIF, HEIC, HEIF
            <br />
            Max size: 10 MB
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Metadata form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <form onSubmit={onFormSubmit} className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditMode ? "Edit Photo" : "Upload Photo"}
            </h1>
          </div>

          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={handlePhotoDelete}
              className="gap-2"
            >
              <Trash2 size={16} />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>

        {notification && (
          <div className="mb-6">
            <StatusMessage
              message={notification.text}
              isSuccess={notification.ok}
            />
          </div>
        )}

        {/* Image Preview */}
        <div className="mb-6 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-lg">
          <div className="overflow-auto max-h-96 bg-slate-50 flex items-center justify-center">
            <img
              src={photoPreviewUrl}
              alt="Preview"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 mb-6">
          {/* Basic Info */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Slug *</span>
                <input
                  {...register("slug", { required: "Slug is required" })}
                  className={inputStyles}
                  placeholder="my-photo-slug"
                />
                {errors.slug && (
                  <span className="text-xs text-red-600">
                    {errors.slug.message}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Subject *</span>
                <select
                  {...register("subjectId", {
                    required: "Subject is required",
                  })}
                  className={inputStyles}
                >
                  <option value="">— Select Subject —</option>
                  {subjectList.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                      {subject.instaHandle ? ` (${subject.instaHandle})` : ""}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <span className="text-xs text-red-600">
                    {errors.subjectId.message}
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Camera Settings */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Camera Settings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Body</span>
                <input
                  {...register("cameraBody")}
                  className={inputStyles}
                  placeholder="e.g. Canon 5D"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Lens</span>
                <input
                  {...register("lens")}
                  className={inputStyles}
                  placeholder="e.g. 50mm"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Aperture</span>
                <input
                  {...register("aperture")}
                  className={inputStyles}
                  placeholder="f/1.8"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>ISO</span>
                <input
                  {...register("iso")}
                  className={inputStyles}
                  placeholder="400"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Shutter</span>
                <input
                  {...register("shutterSpeed")}
                  className={inputStyles}
                  placeholder="1/250"
                />
              </label>
            </div>
          </div>

          {/* Location & Time */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Location & Timestamp
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Place</span>
                <input
                  {...register("place")}
                  className={inputStyles}
                  placeholder="Location name"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>City</span>
                <input
                  {...register("city")}
                  className={inputStyles}
                  placeholder="City"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Date</span>
                <input
                  type="date"
                  {...register("capturedDate")}
                  className={inputStyles}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelStyles}>Time</span>
                <input
                  type="time"
                  {...register("capturedTime")}
                  className={inputStyles}
                />
              </label>
            </div>
          </div>

          {/* Caption */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Caption
            </h2>
            <textarea
              {...register("caption")}
              rows={4}
              className={cn(inputStyles, "resize-none")}
              placeholder="Share the story behind this photo…"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
            <Button
              type="submit"
              disabled={isProcessing}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              {isEditMode ? (
                <>
                  <Save size={16} />
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {isSubmitting ? "Creating…" : "Create Photo"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Replace Image Section (Edit Mode Only) */}
        {isEditMode && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Replace Image
            </h2>

            <ImagePicker
              label="Choose New Image"
              fileName={replacementFile?.name ?? ""}
              onFile={handleReplacementImageSelect}
              disabled={isProcessing}
            />

            {replacementPreviewUrl && (
              <div className="mt-4 rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
                <img
                  src={replacementPreviewUrl}
                  alt="Replacement preview"
                  className="w-full h-auto max-h-64 object-cover"
                />
              </div>
            )}

            {replacementFile && (
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleImageReplacement}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  <Upload size={16} />
                  {isReplacingImage ? "Uploading…" : "Replace Image"}
                </Button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function UploadPage() {
  return (
    <Suspense>
      <UploadForm />
    </Suspense>
  );
}

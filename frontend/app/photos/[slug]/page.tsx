"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft, LuCamera as Camera, LuAperture as Aperture, LuTimer as Timer, LuZap as Zap,
  LuMapPin as MapPin, LuCalendar as Calendar, LuClock as Clock, LuUser as User, LuInstagram as Instagram,
  LuPencil as Pencil, LuDownload as Download,
} from "react-icons/lu";
import PhotoService from "@/services/PhotoService";
import { isApiError } from "@/lib/typeGuard";

type Photo = {
  id: string;
  slug: string;
  subjectName: string | null;
  subjectInsta: string | null;
  cameraBody: string | null;
  lens: string | null;
  place: string | null;
  city: string | null;
  capturedDate: string | null;
  capturedTime: string | null;
  caption: string | null;
  aperture: string | null;
  iso: string | null;
  shutterSpeed: string | null;
  originalUrl: string;
  compressedUrl: string | null;
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function PhotoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    PhotoService.getPhotoBySlug<Photo>(slug).then(res => {
      if (isApiError(res)) { setError(res.errorMessage); return; }
      setPhoto(res.data!);
    });
  }, [slug]);

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  if (!photo) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
    </div>
  );

  const imageUrl = photo.originalUrl ?? photo.compressedUrl;

  const cameraStats = [
    photo.cameraBody   && { icon: <Camera size={15} />,   label: "Camera",   value: photo.cameraBody },
    photo.lens         && { icon: <Camera size={15} />,   label: "Lens",     value: photo.lens },
    photo.aperture     && { icon: <Aperture size={15} />, label: "Aperture", value: photo.aperture },
    photo.iso          && { icon: <Zap size={15} />,      label: "ISO",      value: photo.iso },
    photo.shutterSpeed && { icon: <Timer size={15} />,    label: "Shutter",  value: photo.shutterSpeed },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const locationStats = [
    photo.place        && { icon: <MapPin size={15} />,   label: "Place", value: photo.place },
    photo.city         && { icon: <MapPin size={15} />,   label: "City",  value: photo.city },
    photo.capturedDate && { icon: <Calendar size={15} />, label: "Date",  value: new Date(photo.capturedDate).toLocaleDateString() },
    photo.capturedTime && { icon: <Clock size={15} />,    label: "Time",  value: photo.capturedTime },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {photo.slug
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={photo.slug}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200"
            >
              <Download size={15} />
              Download
            </a>
            <button
              onClick={() => router.push(`/upload?id=${photo.id}`)}
              className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors px-3 py-1.5 rounded-lg"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.1)] bg-gray-100 overflow-auto max-h-[calc(100vh-10rem)]">
          <img
            src={imageUrl}
            alt={photo.slug}
            className="block max-w-none w-auto h-auto"
          />
        </div>

        {/* Subject */}
        {(photo.subjectName || photo.subjectInsta) && (
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <User size={20} className="text-indigo-400" />
            </div>
            <div>
              {photo.subjectName && (
                <p className="font-semibold text-gray-900">{photo.subjectName}</p>
              )}
              {photo.subjectInsta && (
                <a
                  href={`https://instagram.com/${photo.subjectInsta.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  <Instagram size={13} />
                  {photo.subjectInsta.startsWith("@") ? photo.subjectInsta : `@${photo.subjectInsta}`}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Caption */}
        {photo.caption && (
          <p className="text-gray-600 text-base leading-relaxed border-l-2 border-indigo-200 pl-4 italic">
            {photo.caption}
          </p>
        )}

        {/* Camera settings */}
        {cameraStats.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Camera Settings</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {cameraStats.map(s => <Stat key={s.label} {...s} />)}
            </div>
          </div>
        )}

        {/* Location & Time */}
        {locationStats.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Location & Time</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {locationStats.map(s => <Stat key={s.label} {...s} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

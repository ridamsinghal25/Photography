"use client";

import { useState, useEffect } from "react";
import {
  LuPencil as Pencil,
  LuTrash2 as Trash2,
  LuPlus as Plus,
  LuInstagram as Instagram,
  LuMail as Mail,
  LuPhone as Phone,
  LuMapPin as MapPin,
  LuLink as Link,
  LuUsers as Users,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import SubjectService from "@/services/SubjectService";
import { isApiError } from "@/lib/typeGuard";
import SubjectFormDialog from "@/components/modal/SubjectFormDialog";
import ConfirmDialog from "@/components/modal/ConfirmDialog";
import type { Subject } from "@/types/subject";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function SubjectCard({
  subject,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
            {initials(subject.name)}
          </div>
          <div>
            <p className="font-bold text-zinc-950 text-base leading-tight">
              {subject.name}
            </p>
            {subject.instaHandle && (
              <p className="flex items-center gap-1 text-md text-indigo-600 font-medium mt-0.5">
                <Instagram size={16} />
                {subject.instaHandle}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title="Edit"
            className="text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="Delete"
            className="text-zinc-700 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* Details */}
      {(subject.email ||
        subject.phone_number ||
        subject.city ||
        subject.country ||
        subject.portfolio_url) && (
        <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2">
          {subject.email && (
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <Mail size={13} className="shrink-0 text-zinc-700" />
              {subject.email}
            </p>
          )}
          {subject.phone_number && (
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <Phone size={13} className="shrink-0 text-zinc-700" />
              {subject.phone_number}
            </p>
          )}
          {(subject.city || subject.country) && (
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <MapPin size={13} className="shrink-0 text-zinc-700" />
              {[subject.city, subject.country].filter(Boolean).join(", ")}
            </p>
          )}
          {subject.portfolio_url && (
            <a
              href={subject.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
            >
              <Link size={13} className="shrink-0" />
              Portfolio
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    SubjectService.getSubjects<Subject[]>().then((res) => {
      if (!isApiError(res)) setSubjects(res.data!);
      setLoading(false);
    });
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (s: Subject) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleFormSuccess = (updated: Subject) => {
    setSubjects((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await SubjectService.deleteSubject(deleteTarget.id);
    if (!isApiError(res))
      setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950 tracking-tight">
              Subjects
            </h1>
            <p className="text-base text-zinc-700 mt-1">
              Manage the people you photograph.
            </p>
          </div>
          <Button
            onClick={openCreate}
            size="lg"
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
          >
            <Plus size={17} />
            New Subject
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-pulse"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-zinc-200 shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-28 rounded bg-zinc-200" />
                      <div className="h-3 w-20 rounded bg-zinc-200" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="size-8 rounded bg-zinc-200" />
                    <div className="size-8 rounded bg-zinc-200" />
                  </div>
                </div>
                <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2">
                  <div className="h-3 w-40 rounded bg-zinc-200" />
                  <div className="h-3 w-32 rounded bg-zinc-200" />
                  <div className="h-3 w-36 rounded bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="size-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <Users size={28} className="text-zinc-700" />
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-800">
                No subjects yet
              </p>
              <p className="text-sm text-zinc-700 mt-1">
                Add your first subject to get started.
              </p>
            </div>
            <Button
              onClick={openCreate}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
            >
              <Plus size={15} /> Add Subject
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-700 -mt-4">
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  onEdit={() => openEdit(s)}
                  onDelete={() => setDeleteTarget(s)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editing}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Subject"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SubjectService from "@/services/SubjectService";
import { isApiError } from "@/lib/typeGuard";
import type { Subject, SubjectCreateInput } from "@/types/subject";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 bg-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all";

const LABEL = "flex flex-col gap-1.5 text-sm font-semibold text-zinc-800";

type FormData = SubjectCreateInput;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject;
  onSuccess: (subject: Subject) => void;
};

export default function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  onSuccess,
}: Props) {
  const isEdit = !!subject;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    if (open) {
      reset({
        name: subject?.name ?? "",
        instaHandle: subject?.instaHandle ?? "",
        email: subject?.email ?? "",
        phone_number: subject?.phone_number ?? "",
        city: subject?.city ?? "",
        country: subject?.country ?? "",
        portfolio_url: subject?.portfolio_url ?? "",
      });
    }
  }, [open, subject, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const res = isEdit
      ? await SubjectService.updateSubject<Subject>(subject.id, data)
      : await SubjectService.createSubject<Subject>(data);

    if (isApiError(res)) {
      return;
    }
    onSuccess(res.data!);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100">
          <DialogTitle className="text-xl font-bold text-zinc-950">
            {isEdit ? "Edit Subject" : "New Subject"}
          </DialogTitle>
          <p className="text-sm text-zinc-700 mt-0.5">
            {isEdit
              ? "Update the subject's information."
              : "Fill in the details for the new subject."}
          </p>
        </DialogHeader>

        {/* Form */}
        <form
          id="subject-form"
          onSubmit={onSubmit}
          className="px-6 py-5 flex flex-col gap-5"
        >
          {/* Name — full width */}
          <label className={cn(LABEL, "block")}>
            Name <span className="text-red-500 font-normal">*</span>
            <input
              {...register("name", { required: "Name is required" })}
              className={cn(INPUT, "mt-1")}
              placeholder="Full name"
              autoFocus
            />
            {errors.name && (
              <span className="text-red-500 text-xs font-normal">
                {errors.name.message}
              </span>
            )}
          </label>

          {/* Row: Instagram + Email */}
          <div className="grid grid-cols-2 gap-4">
            <label className={LABEL}>
              Instagram
              <input
                {...register("instaHandle", {
                  pattern: {
                    value: /^@\S+$/,
                    message: "Must start with @ and have no spaces",
                  },
                })}
                className={INPUT}
                placeholder="@handle"
              />
              {errors.instaHandle && (
                <span className="text-red-500 text-xs font-normal">
                  {errors.instaHandle.message}
                </span>
              )}
            </label>
            <label className={LABEL}>
              Email
              <input
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email",
                  },
                })}
                type="email"
                className={INPUT}
                placeholder="email@example.com"
              />
              {errors.email && (
                <span className="text-red-500 text-xs font-normal">
                  {errors.email.message}
                </span>
              )}
            </label>
          </div>

          {/* Row: Phone + City + Country */}
          <div className="grid grid-cols-3 gap-4">
            <label className={LABEL}>
              Phone
              <input
                {...register("phone_number")}
                className={INPUT}
                placeholder="+1 234 567 8900"
              />
            </label>
            <label className={LABEL}>
              City
              <input
                {...register("city")}
                className={INPUT}
                placeholder="New York"
              />
            </label>
            <label className={LABEL}>
              Country
              <input
                {...register("country")}
                className={INPUT}
                placeholder="USA"
              />
            </label>
          </div>

          {/* Portfolio URL — full width */}
          <label className={LABEL}>
            Portfolio URL
            <input
              {...register("portfolio_url", {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Must be a valid URL starting with http(s)://",
                },
              })}
              type="url"
              className={INPUT}
              placeholder="https://portfolio.com"
            />
            {errors.portfolio_url && (
              <span className="text-red-500 text-xs font-normal">
                {errors.portfolio_url.message}
              </span>
            )}
          </label>
        </form>

        {/* Footer */}
        <DialogFooter className="px-6 pb-7 border-t border-zinc-100 bg-zinc-50 flex flex-row justify-end gap-3 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="subject-form"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0"
          >
            {isSubmitting
              ? "Saving…"
              : isEdit
                ? "Save Changes"
                : "Create Subject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Toaster } from "react-hot-toast";

export function HotToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "text-sm",
        error: {
          duration: 3000,
        },
      }}
    />
  );
}

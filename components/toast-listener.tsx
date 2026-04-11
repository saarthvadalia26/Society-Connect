"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function ToastListenerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const successMsg = searchParams.get("toast");
    const errorMsg = searchParams.get("toastError");

    if (successMsg) {
      toast.success(successMsg);
    }
    if (errorMsg) {
      toast.error(errorMsg);
    }

    if (successMsg || errorMsg) {
      // Clear the URL parameters without triggering a reload or affecting the rest of the URL
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("toast");
      currentUrl.searchParams.delete("toastError");
      window.history.replaceState({}, "", currentUrl.toString());
    }
  }, [searchParams]);

  return null;
}

export function ToastListener() {
  return (
    <Suspense fallback={null}>
      <ToastListenerInner />
    </Suspense>
  );
}

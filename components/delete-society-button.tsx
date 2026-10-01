"use client";

import { useState } from "react";
import { DeleteSocietyModal } from "./delete-society-modal";

export function DeleteSocietyButton({ societyName = "Society" }: { societyName?: string }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="shrink-0 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Delete society
      </button>

      <DeleteSocietyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        societyName={societyName}
      />
    </>
  );
}

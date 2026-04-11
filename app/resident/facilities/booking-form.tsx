"use client";

import { useState } from "react";
import { Label, Input } from "@/components/ui";

export function BookingForm({ facilityId, fee }: { facilityId: string; fee: number }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const calculateHours = () => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startH = sh + sm / 60;
    const endH = eh + em / 60;
    if (endH <= startH) return 0;
    return Math.max(1, Math.ceil(endH - startH));
  };

  const hours = calculateHours();
  const total = hours * fee;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="facility_id" value={facilityId} />
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor={`date-${facilityId}`}>Date</Label>
          <Input id={`date-${facilityId}`} name="date" type="date" required />
        </div>
        <div>
          <Label htmlFor={`start-${facilityId}`}>Start Time</Label>
          <Input 
            id={`start-${facilityId}`} 
            name="start_time" 
            type="time" 
            required 
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="text-slate-900 bg-white" 
          />
        </div>
        <div>
          <Label htmlFor={`end-${facilityId}`}>End Time</Label>
          <Input 
            id={`end-${facilityId}`} 
            name="end_time" 
            type="time" 
            required 
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="text-slate-900 bg-white" 
          />
        </div>
      </div>

      {start && end && hours > 0 ? (
        <div className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          Total: ₹{total.toLocaleString("en-IN")} ({hours} hour{hours > 1 ? "s" : ""} @ ₹{fee}/hr)
        </div>
      ) : start && end && hours === 0 ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
          End time must be after start time.
        </div>
      ) : null}
    </div>
  );
}

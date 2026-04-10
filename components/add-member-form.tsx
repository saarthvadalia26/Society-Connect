"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AddMemberForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [role, setRole] = useState("resident");

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required placeholder="e.g. Rohan Sharma" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="e.g. rohan@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Password (min 6 chars)</Label>
        <Input id="password" name="password" type="password" required minLength={6} placeholder="Their login password" />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="resident">Resident</option>
          <option value="guard">Security Guard</option>
        </select>
      </div>
      {role === "resident" ? (
        <>
          <hr className="my-1 border-slate-200 dark:border-slate-700" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="block">Block</Label>
              <Input id="block" name="block" required placeholder="e.g. A" className="uppercase" />
            </div>
            <div>
              <Label htmlFor="flat_number">Flat no.</Label>
              <Input id="flat_number" name="flat_number" required placeholder="e.g. 101" />
            </div>
          </div>
        </>
      ) : null}
      <SubmitButton loadingText="Adding member...">Add member</SubmitButton>
    </form>
  );
}

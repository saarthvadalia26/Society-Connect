import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Input, Label, Textarea, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

async function postNoticeAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await db.addNotice({ society_id: user.society_id, title, body, created_by: user.id });
  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export default async function AdminNoticesPage() {
  const user = await requireRole("admin");
  const notices = await db.listNotices(user.society_id);

  return (
    <div>
      <PageHeader title="Notice board" description="Official announcements that don't get buried in WhatsApp." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Post a notice" />
          <CardBody>
            <form action={postNoticeAction} className="space-y-3">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required maxLength={120} />
              </div>
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" name="body" rows={5} required />
              </div>
              <SubmitButton loadingText="Publishing...">Publish</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`Published notices (${notices.length})`} />
          <CardBody>
            {notices.length === 0 ? (
              <EmptyState title="No notices yet" hint="Post your first one." />
            ) : (
              <ul className="space-y-3">
                {notices.map((n) => (
                  <li key={n.id} className="!rounded-lg !border !border-slate-700/50 !bg-slate-900/40 p-4 mb-3">
                    <div className="!text-lg !font-bold !text-[#FFFFFF]" style={{ color: '#FFFFFF', opacity: 1, visibility: 'visible' }}>{n.title}</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed !text-[#CBD5E1]" style={{ color: '#CBD5E1', opacity: 1, visibility: 'visible' }}>{n.body}</div>
                    <div className="mt-3 text-[11px] !text-[#94A3B8]">{new Date(n.created_at).toLocaleString("en-IN")}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

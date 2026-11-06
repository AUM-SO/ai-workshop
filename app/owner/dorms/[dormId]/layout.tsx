import { Suspense } from "react";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { DormNav } from "@/components/dorm/dorm-nav";
import { DormStatusChip } from "@/components/dorm/dorm-status-chip";
import { getOwnedDorm } from "@/lib/dorms/owner";

export default function DormLayout({ children, params }: LayoutProps<"/owner/dorms/[dormId]">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <Suspense fallback={<div className="h-28" aria-hidden />}>
        <DormHeader params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function DormHeader({ params }: Pick<LayoutProps<"/owner/dorms/[dormId]">, "params">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb aria-label="ตำแหน่งหน้า">
        <BreadcrumbItem href="/owner">หอพักของฉัน</BreadcrumbItem>
        <BreadcrumbItem current>{dorm.name}</BreadcrumbItem>
      </Breadcrumb>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-title-1-semibold text-text-primary">{dorm.name}</h1>
        <DormStatusChip status={dorm.status} />
      </div>
      <DormNav dormId={dorm.id} />
    </div>
  );
}

import { Chip } from "@/components/base/badges/chip";
import { DORM_STATUS_LABEL, type DormStatus } from "@/lib/dorms/options";

const COLOR = { draft: "neutral", published: "lime", archived: "rose" } as const;

export function DormStatusChip({ status }: { status: DormStatus }) {
  return (
    <Chip color={COLOR[status]} variant="caption">
      {DORM_STATUS_LABEL[status]}
    </Chip>
  );
}

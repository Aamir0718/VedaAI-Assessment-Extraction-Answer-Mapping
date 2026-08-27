import { DEFAULT_STAGE_LABELS, STAGE_ORDER, type StageId } from "@/lib/processing/stages";
import { StageItem } from "./StageItem";

type Props = { received: { id: StageId; label: string }[]; complete?: boolean };

/** Renders the fixed stage sequence — never a generic spinner. */
export function StageList({ received, complete }: Props) {
  return (
    <ul className="space-y-2">
      {STAGE_ORDER.map((id, index) => {
        const stage = received[index];
        const isLast = index === received.length - 1;
        const status = !stage ? "pending" : complete || !isLast ? "done" : "active";
        return <StageItem key={id} label={stage?.label ?? DEFAULT_STAGE_LABELS[id]} status={status} />;
      })}
    </ul>
  );
}

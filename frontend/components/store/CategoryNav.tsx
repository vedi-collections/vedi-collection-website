import { cn } from "@/lib/cn";
import { MAIN_TABS, type MainTab, type SubDef } from "@/lib/shop/catalog";

/** Horizontally-scrollable sub-category chips (with "soon" labels). */
export function SubChips({
  subs,
  active,
  onSelect
}: {
  subs: SubDef[];
  active: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {subs.map((sub) => (
        <button
          key={sub.label}
          type="button"
          onClick={() => onSelect(sub.label)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-bold transition",
            active === sub.label
              ? "border-accent bg-accent text-surface"
              : "border-line bg-surface text-muted"
          )}
        >
          {sub.label}
          {sub.soon && (
            <span className={cn("ml-1.5 text-[13px] font-semibold", active === sub.label ? "text-surface/80" : "text-muted-strike")}>
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

type CategoryNavProps = {
  main: MainTab;
  onMain: (main: MainTab) => void;
  subs: SubDef[];
  activeSub: string | null;
  onSub: (label: string) => void;
};

/** Mobile category navigation: main tabs row + sub-chips row. */
export function CategoryNav({ main, onMain, subs, activeSub, onSub }: CategoryNavProps) {
  return (
    <div className="px-4 pb-0.5 pt-3 min-[900px]:hidden">
      <div className="flex gap-2">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onMain(tab)}
            className={cn(
              "flex-1 rounded-full border px-3 py-2.5 text-[15px] font-bold transition",
              main === tab ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-muted"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {subs.length > 0 && (
        <div className="mt-2.5">
          <SubChips subs={subs} active={activeSub} onSelect={onSub} />
        </div>
      )}
    </div>
  );
}

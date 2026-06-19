import { buttonClasses } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { waNotifyLink } from "@/lib/shop/whatsapp";

/** Shown in place of the grid when a "coming soon" sub-category is selected. */
export function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8c9a8] bg-info px-5 py-7 text-center min-[900px]:px-8 min-[900px]:py-12">
      <p className="text-[13px] font-bold uppercase tracking-[0.22em] text-accent">Arriving soon</p>
      <h3 className="mt-2 font-serif text-[28px] font-semibold italic text-heading min-[900px]:text-[40px]">
        {label} is being curated
      </h3>
      <p className="mx-auto mt-2.5 max-w-[38ch] text-base leading-relaxed text-muted">
        We are selecting the right fabrics before this edit goes live. Ask us on WhatsApp and we will
        notify you as soon as fresh pieces arrive.
      </p>
      <a
        href={waNotifyLink(label)}
        target="_blank"
        rel="noreferrer"
        className={buttonClasses("whatsapp", "md", "mt-4")}
      >
        <WhatsAppIcon className="h-[18px] w-[18px]" /> Notify me
      </a>
    </div>
  );
}

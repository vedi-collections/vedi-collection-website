import { Container } from "@/components/layout/Container";

const ITEMS = [
  { title: "Mill-direct", caption: "fresh fabric picks" },
  { title: "COD + UPI", caption: "confirm on chat" },
  { title: "WhatsApp", caption: "human help first" }
];

/** Three-up store-promise strip. */
export function TrustStrip() {
  return (
    <div className="mt-5 border-y border-line">
      <Container className="grid grid-cols-3 gap-1.5 py-3.5">
        {ITEMS.map((item) => (
          <div key={item.title} className="text-center">
            <strong className="block text-xs font-bold text-primary">{item.title}</strong>
            <span className="mt-0.5 block text-[11px] text-muted-soft">{item.caption}</span>
          </div>
        ))}
      </Container>
    </div>
  );
}

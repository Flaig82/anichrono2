import { ArrowRight } from "lucide-react";

interface ViewMoreButtonProps {
  href?: string;
}

export default function ViewMoreButton({ href = "#" }: ViewMoreButtonProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/[0.32] px-5 py-2 text-[13px] font-body font-bold text-aura-text/80 transition-all hover:text-aura-text hover:border-white/50"
      style={{ boxShadow: "0 0 16px rgba(235, 99, 37, 0.15)" }}
    >
      View More
      <ArrowRight size={14} />
    </a>
  );
}

interface SectionLabelProps {
  children: React.ReactNode;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h2
      className="font-brand text-sm font-bold tracking-tight text-white"
      style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
    >
      {children}
    </h2>
  );
}

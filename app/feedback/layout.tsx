import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Submit feedback, report bugs, or ask questions about AnimeChrono.",
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

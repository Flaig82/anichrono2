import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to AnimeChrono to track your anime journey and build your Aura.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

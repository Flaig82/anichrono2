import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AnimeChrono",
  description:
    "Privacy policy for AnimeChrono — how we handle your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16 max-w-3xl">
      <h1 className="font-brand text-[28px] md:text-[36px] font-bold text-white">
        Privacy Policy
      </h1>

      <div className="mt-6 font-body text-[14px] leading-relaxed text-aura-muted2">
        <p>
          At AnimeChrono, one of our main priorities is the privacy of our
          visitors. This Privacy Policy describes what information is collected
          and how we use it.
        </p>

        {/* Logging */}
        <h2 className="font-brand text-[18px] font-bold text-white mt-8 mb-3">
          Logging
        </h2>
        <p>
          AnimeChrono follows standard procedures for server log files. The
          information collected may include:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Internet Protocol (IP) addresses</li>
          <li>Browser type</li>
          <li>Internet Service Provider (ISP)</li>
          <li>Date and time stamps</li>
          <li>Referring and exit pages</li>
          <li>Number of clicks</li>
        </ul>
        <p className="mt-2">
          This information is not linked to anything personally identifiable.
          It is used for analyzing trends, administering the site, and
          gathering broad demographic information.
        </p>

        {/* Cookies */}
        <h2 className="font-brand text-[18px] font-bold text-white mt-8 mb-3">
          Cookies
        </h2>
        <p>
          AnimeChrono uses cookies to store information about your preferences
          and to manage authentication sessions via Supabase Auth. These
          cookies are essential for keeping you logged in and customizing your
          experience.
        </p>

        <h3 className="font-brand text-[15px] font-bold text-white mt-5 mb-2">
          Amazon Affiliates Cookie
        </h3>
        <p>
          Amazon Associates, a third-party affiliate program, uses cookies to
          track referrals and attribute purchases. You can read more about
          Amazon Associates and their{" "}
          <a
            href="https://affiliate-program.amazon.com/gp/associates/agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-aura-orange hover:brightness-110 transition-all"
          >
            Operating Agreement here
          </a>
          .
        </p>

        {/* Third-party services */}
        <h2 className="font-brand text-[18px] font-bold text-white mt-8 mb-3">
          Third-Party Services
        </h2>
        <p>
          Third-party services such as Amazon Associates may use cookies and
          tracking technologies in their links and advertisements on
          AnimeChrono. These third parties may automatically receive your IP
          address when you interact with their content. AnimeChrono has no
          access to or control over cookies used by third-party services.
        </p>
        <p className="mt-2">
          We advise you to consult the respective privacy policies of any
          third-party services for more information on their practices and how
          to opt out.
        </p>

        {/* Children's privacy */}
        <h2 className="font-brand text-[18px] font-bold text-white mt-8 mb-3">
          Children&apos;s Privacy
        </h2>
        <p>
          AnimeChrono does not knowingly collect any personally identifiable
          information from children under the age of 13. If you believe your
          child has provided such information on our website, please contact us
          immediately and we will make our best effort to remove it from our
          records.
        </p>

        {/* Consent */}
        <h2 className="font-brand text-[18px] font-bold text-white mt-8 mb-3">
          Consent
        </h2>
        <p>
          By using AnimeChrono, you consent to this Privacy Policy and agree to
          its terms.
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer — AnimeChrono",
  description:
    "Affiliate disclosure and disclaimer for AnimeChrono.",
};

export default function DisclaimerPage() {
  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16 max-w-3xl">
      <h1 className="font-brand text-[28px] md:text-[36px] font-bold text-white">
        Disclaimer
      </h1>

      <div className="mt-6 space-y-4 font-body text-[14px] leading-relaxed text-aura-muted2">
        <p>
          AnimeChrono displays links and advertisements for various services to
          help support keeping the website running. As part of this, we are
          participants in the{" "}
          <a
            href="https://affiliate-program.amazon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-aura-orange hover:brightness-110 transition-all"
          >
            Amazon Services LLC Associates Program
          </a>
          , an affiliate advertising program designed to provide a means for
          sites to earn advertising fees by advertising and linking to
          Amazon.com.
        </p>

        <p>
          Our franchise pages include links to relevant products on Amazon.
          These links contain an affiliate tag which allows us to earn a small
          percentage of each sale at no extra cost to you. This revenue helps
          cover hosting, domain, and development costs, and allows us to
          continue building and maintaining AnimeChrono.
        </p>

        <p>
          We only link to products that are directly relevant to the anime
          franchises discussed on the site. Our editorial content and watch
          order recommendations are not influenced by affiliate partnerships.
        </p>

        <p>
          If you have any questions about this disclosure, feel free to reach
          out via our contact channels.
        </p>
      </div>
    </main>
  );
}

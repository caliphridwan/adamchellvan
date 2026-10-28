import { PageHero } from "./common";

export type LegalSection = { heading: string; body: string[] };

/** Shared layout for legal pages. The drafts are starting points and must be reviewed by a qualified adviser. */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} breadcrumbs={[{ label: title }]} />
      <section className="container max-w-3xl py-14 md:py-20">
        <p className="mb-10 rounded border border-champagne-400/60 bg-champagne-300/15 px-4 py-3 text-sm text-champagne-700">
          [DRAFT — review with a qualified legal adviser and update for your jurisdiction before launch.] Last updated: {updated}
        </p>
        <div className="prose-estate">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

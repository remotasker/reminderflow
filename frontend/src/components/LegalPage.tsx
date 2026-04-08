import Link from 'next/link';

interface LegalSection {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

interface LegalPageProps {
  title: string;
  description: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
  currentPage: 'terms' | 'privacy';
}

const PAGE_LINKS = [
  { href: '/terms', label: 'Terms of Service', page: 'terms' as const },
  { href: '/privacy', label: 'Privacy Policy', page: 'privacy' as const },
];

export function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
  currentPage,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              ReminderFlow
            </Link>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Legal
              </p>
              <h1 className="text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {PAGE_LINKS.map((link) => {
              const isActive = link.page === currentPage;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'border border-slate-200/80 bg-white text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="card h-fit space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Last Updated
              </p>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{lastUpdated}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Quick Access
              </p>
              <div className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.title}
                    href={`#${toAnchorId(section.title)}`}
                    className="block text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Questions about these terms?</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Email{' '}
                <a
                  href="mailto:support@reminderflow.app"
                  className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 dark:text-white dark:decoration-slate-700"
                >
                  support@reminderflow.app
                </a>
                {' '}or reply through the ReminderFlow support flow.
              </p>
            </div>
          </aside>

          <article className="card space-y-10">
            {sections.map((section) => (
              <section key={section.title} id={toAnchorId(section.title)} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}

function toAnchorId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

const quickLinks = [
  {
    title: 'Getting Started',
    description: 'Install the package and run your first optimization workflow.',
    to: '/docs/$' as const,
    params: { _splat: 'getting-started' },
  },
  {
    title: 'Quickstart',
    description: 'Follow the shortest path from state model to a working solver.',
    to: '/docs/$' as const,
    params: { _splat: 'quickstart' },
  },
  {
    title: 'API Reference',
    description: 'Browse runtime contracts, types, and integration points.',
    to: '/docs/$' as const,
    params: { _splat: 'api-reference' },
  },
];

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'timetable-sa docs',
      },
      {
        name: 'description',
        content:
          'Technical documentation for timetable-sa: setup, quickstart, core concepts, configuration, and API reference.',
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-fd-muted/50 via-transparent to-transparent" />

        <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 md:px-6 md:pt-16">
          <p className="mb-4 inline-flex rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            Technical editorial docs for timetable-sa
          </p>

          <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Build constraint-driven optimization workflows with confidence.
          </h1>

          <p className="mt-4 max-w-3xl text-pretty text-sm leading-6 text-fd-muted-foreground md:text-base">
            This documentation focuses on practical implementation: modeling state,
            defining constraints, tuning search behavior, and shipping production
            solvers using <code>timetable-sa</code>.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/docs/$"
              params={{ _splat: 'getting-started' }}
              className="inline-flex items-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
            >
              Start with getting started
            </Link>

            <Link
              to="/docs/$"
              params={{ _splat: 'quickstart' }}
              className="inline-flex items-center rounded-md border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium text-fd-foreground transition hover:bg-fd-accent"
            >
              Open quickstart
            </Link>

            <a
              href="https://github.com/albertabayor/timetable-sa"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium text-fd-muted-foreground transition hover:text-fd-foreground"
            >
              View package repository
            </a>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-6 md:grid-cols-3 md:px-6">
          {quickLinks.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              params={item.params}
              className="group rounded-xl border border-fd-border bg-fd-card/80 p-4 transition hover:border-fd-primary/50 hover:bg-fd-card"
            >
              <p className="text-sm font-semibold text-fd-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
                {item.description}
              </p>
              <p className="mt-3 text-xs font-medium text-fd-primary">Read section &gt;</p>
            </Link>
          ))}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 md:px-6">
          <div className="rounded-2xl border border-fd-border bg-fd-card p-5 md:p-7">
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">Why this docs hub</h2>
            <div className="mt-4 grid gap-4 text-sm leading-6 text-fd-muted-foreground md:grid-cols-2">
              <p>
                Follow a deliberate path from first install to advanced runtime tuning,
                including search strategy, hard-constraint convergence, and production
                diagnostics.
              </p>
              <p>
                Each page is written for implementation decisions, not just API browsing:
                what to configure, when to change it, and how it affects solver behavior.
              </p>
            </div>
          </div>
        </section>
      </main>
    </HomeLayout>
  );
}

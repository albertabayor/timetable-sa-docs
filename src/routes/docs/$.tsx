import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import browserCollections from 'collections/browser';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { baseOptions } from '@/lib/layout.shared';
import { docsContentRoute, gitConfig } from '@/lib/shared';
import { Suspense } from 'react';
import { useMDXComponents } from '@/components/mdx';
import type * as PageTree from 'fumadocs-core/page-tree';
import docsMeta from '../../../content/docs/meta.json';

const availableDocPaths = new Set(
  Object.keys(browserCollections.docs.raw).map((entry) =>
    entry.startsWith('./') ? entry.slice(2) : entry,
  ),
);

function normalizeSplat(splat: string | undefined) {
  return (splat ?? '').replace(/^\/+|\/+$/g, '');
}

function resolveDocPathFromSlug(slug: string) {
  const base = slug === '' ? 'index' : slug;

  const candidates = [
    `${base}.md`,
    `${base}.mdx`,
    `${base}/index.md`,
    `${base}/index.mdx`,
  ];

  return candidates.find((candidate) => availableDocPaths.has(candidate));
}

function formatTitleFromSlug(slug: string) {
  if (slug === 'index') return 'Overview';

  return slug
    .split('/')
    .pop()
    ?.split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ') ?? slug;
}

function buildPageTree(): PageTree.Root {
  const pages: PageTree.Node[] = [];

  for (const slug of docsMeta.pages) {
    const resolved = resolveDocPathFromSlug(slug === 'index' ? '' : slug);
    if (!resolved) continue;

    pages.push({
      type: 'page',
      name: formatTitleFromSlug(slug),
      url: slug === 'index' ? '/docs' : `/docs/${slug}`,
    });
  }

  return {
    name: 'Documentation',
    children: pages,
  };
}

function getPageMarkdownUrlFromPath(docPath: string) {
  const noExtension = docPath.replace(/\.(md|mdx)$/i, '');
  const normalized = noExtension.endsWith('/index')
    ? noExtension.slice(0, -'/index'.length)
    : noExtension;
  const slugs = normalized === 'index' || normalized === '' ? [] : normalized.split('/');
  const segments = [...slugs, 'content.md'];

  return `${docsContentRoute}/${segments.join('/')}`;
}

const docsPageTree = buildPageTree();

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slug = normalizeSplat(params._splat);
    const path = resolveDocPathFromSlug(slug);

    if (!path) throw notFound();

    const loaded = (await clientLoader.preload(path)) as {
      frontmatter?: {
        title?: unknown;
        description?: unknown;
      };
    };

    const data = {
      path,
      markdownUrl: getPageMarkdownUrlFromPath(path),
      pageTree: docsPageTree,
      title:
        typeof loaded.frontmatter?.title === 'string'
          ? loaded.frontmatter.title
          : formatTitleFromSlug(slug === '' ? 'index' : slug),
      description:
        typeof loaded.frontmatter?.description === 'string'
          ? loaded.frontmatter.description
          : 'Technical documentation for timetable-sa.',
    };

    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title ?? 'Documentation'} | timetable-sa docs`,
      },
      {
        name: 'description',
        content: loaderData?.description ?? 'Technical documentation for timetable-sa.',
      },
    ],
  }),
});

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    // you can define props for the component
    {
      markdownUrl,
      path,
    }: {
      markdownUrl: string;
      path: string;
    },
  ) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${path}`}
          />
        </div>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const { path, pageTree, markdownUrl } = Route.useLoaderData();

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense>{clientLoader.useContent(path, { markdownUrl, path })}</Suspense>
    </DocsLayout>
  );
}

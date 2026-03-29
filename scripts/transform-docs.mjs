import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const preferredOrder = [
  'index',
  'introduction',
  'installation',
  'quickstart',
  'core-concepts',
  'configuration',
  'advanced-features',
  'examples',
  'testing-guide',
  'troubleshooting',
  'architecture',
  'api-reference',
  'migration-guide',
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function isMarkdownFile(filePath) {
  return filePath.endsWith('.md') || filePath.endsWith('.mdx');
}

function titleFromFilename(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ');
}

function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content };
  }

  const endMarker = '\n---\n';
  const endIndex = content.indexOf(endMarker, 4);

  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterBlock = content.slice(4, endIndex);
  const body = content.slice(endIndex + endMarker.length);
  const frontmatter = {};

  for (const line of frontmatterBlock.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    const rawValue = match[2].trim();
    const normalizedValue = rawValue.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    frontmatter[key] = normalizedValue;
  }

  return { frontmatter, body };
}

function extractFirstHeading(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function extractDescription(body) {
  const lines = body.split('\n');
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;
    if (!line) continue;
    if (line.startsWith('#')) continue;

    return line;
  }

  return undefined;
}

function rewriteMarkdownLinks(body, outputRelativePath) {
  const currentDir = path.posix.dirname(outputRelativePath.replace(/\\/g, '/'));

  return body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, rawHref) => {
    const href = rawHref.trim();

    if (/^(https?:|mailto:|tel:|#)/i.test(href)) {
      return full;
    }

    const [pathPart, hashPart] = href.split('#');
    if (!pathPart) return full;

    const extension = path.posix.extname(pathPart).toLowerCase();
    if (extension && extension !== '.md' && extension !== '.mdx') {
      return full;
    }

    const cleanedPath = pathPart
      .replace(/README\.mdx?$/i, 'index')
      .replace(/\.mdx?$/i, '');

    const resolvedPath = pathPart.startsWith('/')
      ? cleanedPath.replace(/^\/+/, '')
      : path.posix.normalize(path.posix.join(currentDir, cleanedPath));

    const normalizedPath = resolvedPath.replace(/^\/+/, '');

    let rewrittenPath = '/docs';

    if (normalizedPath !== 'index') {
      rewrittenPath = normalizedPath.endsWith('/index')
        ? `/docs/${normalizedPath.slice(0, -'/index'.length)}`
        : `/docs/${normalizedPath}`;
    }

    if (rewrittenPath.endsWith('/')) {
      rewrittenPath = rewrittenPath.slice(0, -1);
    }

    const rewrittenHref = hashPart ? `${rewrittenPath}#${hashPart}` : rewrittenPath;

    return `[${label}](${rewrittenHref})`;
  });
}

function serializeFrontmatter(frontmatter) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${JSON.stringify(String(value))}`);
  }

  lines.push('---');
  return lines.join('\n');
}

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && isMarkdownFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getSlugFromOutputRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
}

async function main() {
  const rawDir = path.resolve(
    repoRoot,
    getArg('--raw') ?? process.env.SYNC_RAW_DIR ?? '.cache/docs-raw',
  );
  const outputDir = path.resolve(
    repoRoot,
    getArg('--out') ?? process.env.DOCS_OUTPUT_DIR ?? 'content/docs',
  );

  const markdownFiles = (await collectMarkdownFiles(rawDir)).sort();

  if (markdownFiles.length === 0) {
    throw new Error(`No markdown files found in raw directory: ${rawDir}`);
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const generatedSlugs = [];

  for (const sourceFile of markdownFiles) {
    const sourceContent = await readFile(sourceFile, 'utf8');
    const sourceRelative = path.relative(rawDir, sourceFile);

    const normalizedRelative = sourceRelative.replace(/\\/g, '/');
    const outputRelative = normalizedRelative.replace(/README\.mdx?$/i, 'index.md');
    const outputPath = path.join(outputDir, outputRelative);

    const { frontmatter: existing, body } = splitFrontmatter(sourceContent);

    const fallbackTitle = extractFirstHeading(body) ?? titleFromFilename(path.basename(outputRelative));
    const fallbackDescription =
      extractDescription(body) ?? `Documentation page for ${fallbackTitle}.`;

    const frontmatter = {
      title: existing.title || fallbackTitle,
      description: existing.description || fallbackDescription,
    };

    if (existing.icon) {
      frontmatter.icon = existing.icon;
    }

    for (const [key, value] of Object.entries(existing)) {
      if (key === 'title' || key === 'description' || key === 'icon') continue;
      if (!value) continue;
      frontmatter[key] = value;
    }

    const transformedBody = rewriteMarkdownLinks(body, outputRelative).trim();
    const transformedContent = `${serializeFrontmatter(frontmatter)}\n\n${transformedBody}\n`;

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, transformedContent, 'utf8');

    generatedSlugs.push(getSlugFromOutputRelativePath(outputRelative));
  }

  const slugSet = new Set(generatedSlugs);
  const orderedPages = preferredOrder.filter((slug) => slugSet.has(slug));
  const extraPages = generatedSlugs
    .filter((slug) => !preferredOrder.includes(slug))
    .sort((a, b) => a.localeCompare(b));

  const meta = {
    pages: [...orderedPages, ...extraPages],
  };

  const metaPath = path.join(outputDir, 'meta.json');
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

  console.log(`Transformed ${markdownFiles.length} markdown files.`);
  console.log(`Output: ${outputDir}`);
  console.log(`Meta:   ${metaPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function isMarkdownFile(filePath) {
  return filePath.endsWith('.md') || filePath.endsWith('.mdx');
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

function removeCodeBlocks(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock) {
      result.push(line);
    }
  }

  return result.join('\n');
}

function extractLinks(markdown) {
  const links = [];
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    links.push(match[1].trim());
  }

  return links;
}

function isExternalLink(href) {
  return /^[a-zA-Z][a-zA-Z+.-]*:/.test(href);
}

function normalizePath(filePath) {
  return path.normalize(filePath);
}

function targetExists(currentFile, hrefPath, docsDir, markdownSet) {
  if (hrefPath.startsWith('/docs/')) {
    const slug = hrefPath.slice('/docs/'.length).replace(/^\/+|\/+$/g, '');
    const relativeSlug = slug === '' ? 'index' : slug;
    const mdCandidate = normalizePath(path.join(docsDir, `${relativeSlug}.md`));
    const mdxCandidate = normalizePath(path.join(docsDir, `${relativeSlug}.mdx`));

    return markdownSet.has(mdCandidate) || markdownSet.has(mdxCandidate);
  }

  if (hrefPath.startsWith('/')) {
    return true;
  }

  const basePath = path.resolve(path.dirname(currentFile), hrefPath);
  const ext = path.extname(basePath).toLowerCase();

  if (ext === '.md' || ext === '.mdx') {
    return markdownSet.has(normalizePath(basePath));
  }

  const candidates = [
    `${basePath}.md`,
    `${basePath}.mdx`,
    path.join(basePath, 'index.md'),
    path.join(basePath, 'index.mdx'),
  ].map(normalizePath);

  return candidates.some((candidate) => markdownSet.has(candidate));
}

async function main() {
  const docsDir = path.resolve(
    repoRoot,
    getArg('--dir') ?? process.env.DOCS_OUTPUT_DIR ?? 'content/docs',
  );
  const files = await collectMarkdownFiles(docsDir);

  if (files.length === 0) {
    throw new Error(`No markdown files found in docs directory: ${docsDir}`);
  }

  const markdownSet = new Set(files.map(normalizePath));
  const errors = [];

  for (const filePath of files) {
    const rawContent = await readFile(filePath, 'utf8');
    const content = removeCodeBlocks(rawContent);
    const links = extractLinks(content);
    const relativePath = path.relative(docsDir, filePath);

    for (const href of links) {
      const [pathPart] = href.split('#');
      const cleanPath = pathPart.split('?')[0];

      if (!cleanPath) continue;
      if (cleanPath.startsWith('#')) continue;
      if (isExternalLink(cleanPath)) continue;

      const extension = path.extname(cleanPath).toLowerCase();
      if (extension && extension !== '.md' && extension !== '.mdx') continue;

      if (!targetExists(filePath, cleanPath, docsDir, markdownSet)) {
        errors.push(`${relativePath}: broken link -> ${href}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Link check failed:\n- ${errors.join('\n- ')}`);
  }

  console.log(`Validated internal links in ${files.length} markdown files.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

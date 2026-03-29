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

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return null;
  }

  const endMarker = '\n---\n';
  const endIndex = content.indexOf(endMarker, 4);

  if (endIndex === -1) {
    return null;
  }

  const data = {};
  const block = content.slice(4, endIndex);

  for (const line of block.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    data[match[1]] = match[2].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  }

  return data;
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

  const errors = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const relativePath = path.relative(docsDir, filePath);

    if (!frontmatter) {
      errors.push(`${relativePath}: missing frontmatter block`);
      continue;
    }

    if (!frontmatter.title) {
      errors.push(`${relativePath}: missing frontmatter.title`);
    }

    if (!frontmatter.description) {
      errors.push(`${relativePath}: missing frontmatter.description`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Frontmatter validation failed:\n- ${errors.join('\n- ')}`);
  }

  console.log(`Validated frontmatter for ${files.length} markdown files.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

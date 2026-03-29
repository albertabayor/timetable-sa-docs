import { cp, mkdir, readdir, rm } from 'node:fs/promises';
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

async function ensureDirectoryExists(dir) {
  try {
    await readdir(dir);
  } catch {
    throw new Error(`Directory not found: ${dir}`);
  }
}

async function main() {
  const sourceDir = path.resolve(
    repoRoot,
    getArg('--source') ?? process.env.SYNC_SOURCE_DIR ?? '../timetable-sa/docs',
  );
  const rawDir = path.resolve(
    repoRoot,
    getArg('--raw') ?? process.env.SYNC_RAW_DIR ?? '.cache/docs-raw',
  );

  await ensureDirectoryExists(sourceDir);

  await rm(rawDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });

  const markdownFiles = await collectMarkdownFiles(sourceDir);

  if (markdownFiles.length === 0) {
    throw new Error(`No markdown files found in source directory: ${sourceDir}`);
  }

  for (const sourceFile of markdownFiles) {
    const relativePath = path.relative(sourceDir, sourceFile);
    const destinationFile = path.join(rawDir, relativePath);
    const destinationDir = path.dirname(destinationFile);

    await mkdir(destinationDir, { recursive: true });
    await cp(sourceFile, destinationFile, { force: true });
  }

  console.log(`Synced ${markdownFiles.length} markdown files.`);
  console.log(`Source: ${sourceDir}`);
  console.log(`Raw:    ${rawDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

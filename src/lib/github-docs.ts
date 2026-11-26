import fs from 'node:fs';
import path from 'node:path';
import type { ProjectEntry } from '../data/projects';
import { renderMarkdown } from './markdown';

export interface DocItem {
  rawPath: string; // e.g. "01-getting-started/01-installation.md"
  slug: string; // e.g. "getting-started/installation" (or "" for index.md)
  fullSlug: string; // e.g. "/en/doc/syncdap/getting-started/installation/"
  title: string;
  rawContent: string;
  renderedHtml: string;
  prev?: { title: string; fullSlug: string };
  next?: { title: string; fullSlug: string };
  breadcrumbs: Array<{ label: string; href?: string }>;
}

export interface DocsTreeNode {
  type: 'folder' | 'file';
  name: string; // Clean display name (e.g. "Getting Started")
  path: string; // Relative path in tree
  slug?: string;
  fullSlug?: string;
  title?: string;
  children?: DocsTreeNode[];
  isRoot?: boolean;
}

export interface ProjectDocs {
  project: ProjectEntry;
  readmeHtml: string;
  tree: DocsTreeNode[];
  flatDocs: DocItem[];
  docsMap: Map<string, DocItem>;
}

// In-memory cache across build passes
const docsCache = new Map<string, ProjectDocs>();

/**
 * Extracts numeric prefix for natural sorting.
 * Supports numbers like "01", "01.2", "10", "2"
 */
function parseNumericPrefix(name: string): { numbers: number[]; baseName: string } {
  const match = name.match(/^(\d+(?:\.\d+)*)[-_.\s]+(.*)$/);
  if (match) {
    const numParts = match[1].split('.').map((n) => Number.parseFloat(n));
    return { numbers: numParts, baseName: match[2] };
  }
  return { numbers: [], baseName: name };
}

/**
 * Natural comparator comparing segment numbers numerically
 */
function compareNames(a: string, b: string): number {
  const isIndexA = a.toLowerCase().startsWith('index') || a.toLowerCase().startsWith('readme');
  const isIndexB = b.toLowerCase().startsWith('index') || b.toLowerCase().startsWith('readme');
  if (isIndexA && !isIndexB) return -1;
  if (!isIndexA && isIndexB) return 1;

  const parsedA = parseNumericPrefix(a);
  const parsedB = parseNumericPrefix(b);

  if (parsedA.numbers.length > 0 && parsedB.numbers.length > 0) {
    const minLen = Math.min(parsedA.numbers.length, parsedB.numbers.length);
    for (let i = 0; i < minLen; i++) {
      if (parsedA.numbers[i] !== parsedB.numbers[i]) {
        return parsedA.numbers[i] - parsedB.numbers[i];
      }
    }
    if (parsedA.numbers.length !== parsedB.numbers.length) {
      return parsedA.numbers.length - parsedB.numbers.length;
    }
    return parsedA.baseName.localeCompare(parsedB.baseName);
  }

  if (parsedA.numbers.length > 0) return -1;
  if (parsedB.numbers.length > 0) return 1;

  return a.localeCompare(b);
}

/**
 * Cleans a path segment to create a clean URL slug (e.g. "01-getting-started" -> "getting-started")
 */
function cleanSegment(segment: string): string {
  const noExt = segment.replace(/\.(md|mdx)$/i, '');
  const { baseName } = parseNumericPrefix(noExt);
  return baseName
    .toLowerCase()
    .replace(/[^\w-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates clean title from folder or file name
 */
function formatTitle(name: string): string {
  const noExt = name.replace(/\.(md|mdx)$/i, '');
  const { baseName } = parseNumericPrefix(noExt);
  return baseName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Extracts title from markdown content or frontmatter
 */
function extractTitle(content: string, fallbackName: string): string {
  // Check YAML frontmatter title
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const titleLine = fmMatch[1].match(/^title:\s*["']?(.*?)["']?$/m);
    if (titleLine && titleLine[1].trim()) {
      return titleLine[1].trim();
    }
  }

  // Check first # Heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    // Strip markdown formatting if any
    return h1Match[1].replace(/[*_`]/g, '').trim();
  }

  return formatTitle(fallbackName);
}

interface RawFile {
  relativePath: string; // e.g. "01-getting-started/01-installation.md" or "index.md"
  content: string;
}

/**
 * Discovers and reads files locally or from GitHub
 */
async function loadRawFiles(project: ProjectEntry): Promise<{ files: RawFile[]; readme: string }> {
  const config = project.docs;
  if (!config) return { files: [], readme: '' };

  const docsPath = config.docsPath || 'docs';
  const readmeFile = config.readmeFile || 'README.md';

  // 1. Try local filesystem fallback
  if (config.localPath) {
    const possibleBases = [
      path.resolve(config.localPath),
      path.resolve(process.cwd(), config.localPath),
      path.resolve('/home/bagi/Projects', config.localPath.replace(/^\.\.\/?/, '')),
    ];

    for (const baseDir of possibleBases) {
      const fullDocsPath = path.join(baseDir, docsPath);
      if (fs.existsSync(fullDocsPath)) {
        const files: RawFile[] = [];

        function scanDir(currentDir: string, relPrefix = '') {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const ent of entries) {
            const rel = relPrefix ? `${relPrefix}/${ent.name}` : ent.name;
            const full = path.join(currentDir, ent.name);
            if (ent.isDirectory()) {
              scanDir(full, rel);
            } else if (ent.isFile() && /\.(md|mdx)$/i.test(ent.name)) {
              const content = fs.readFileSync(full, 'utf-8');
              files.push({ relativePath: rel, content });
            }
          }
        }

        scanDir(fullDocsPath);

        let readme = '';
        const fullReadmePath = path.join(baseDir, readmeFile);
        if (fs.existsSync(fullReadmePath)) {
          readme = fs.readFileSync(fullReadmePath, 'utf-8');
        }

        return { files, readme };
      }
    }
  }

  // 2. Fetch from GitHub API and Raw GitHub
  const repo = config.repo;
  const branch = config.branch || 'main';
  const token =
    (typeof process !== 'undefined' && process.env?.GITHUB_TOKEN) ||
    import.meta.env?.GITHUB_TOKEN ||
    '';

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'bagi-sh-docs-fetcher',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const treeUrl = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
    const res = await fetch(treeUrl, { headers });
    if (!res.ok) {
      console.warn(`[github-docs] Failed to fetch tree for ${repo}: ${res.statusText}`);
      return { files: [], readme: '' };
    }

    const treeData = (await res.json()) as { tree?: Array<{ path: string; type: string }> };
    const tree = treeData.tree || [];

    const prefix = docsPath.endsWith('/') ? docsPath : `${docsPath}/`;
    const docEntries = tree.filter(
      (item) => item.type === 'blob' && item.path.startsWith(prefix) && /\.(md|mdx)$/i.test(item.path)
    );

    const files: RawFile[] = await Promise.all(
      docEntries.map(async (item) => {
        const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${item.path}`;
        const rawRes = await fetch(rawUrl, { headers });
        const content = rawRes.ok ? await rawRes.text() : '';
        const relativePath = item.path.slice(prefix.length);
        return { relativePath, content };
      })
    );

    let readme = '';
    const readmeEntry = tree.find((item) => item.path.toLowerCase() === readmeFile.toLowerCase());
    if (readmeEntry) {
      const readmeUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${readmeEntry.path}`;
      const readmeRes = await fetch(readmeUrl, { headers });
      if (readmeRes.ok) {
        readme = await readmeRes.text();
      }
    }

    return { files, readme };
  } catch (err) {
    console.error(`[github-docs] Error fetching repository ${repo}:`, err);
    return { files: [], readme: '' };
  }
}

/**
 * Builds the hierarchical DocsTree and linearly ordered docs list
 */
export async function getProjectDocs(project: ProjectEntry): Promise<ProjectDocs> {
  if (docsCache.has(project.slug)) {
    return docsCache.get(project.slug)!;
  }

  const { files, readme } = await loadRawFiles(project);
  const entryFileName = (project.docs?.entryFile || 'index.md').toLowerCase();
  const repo = project.docs?.repo || '';
  const branch = project.docs?.branch || 'main';

  // Map to hold raw items before relative link resolution
  interface TempDoc {
    rawPath: string;
    slug: string;
    fullSlug: string;
    title: string;
    rawContent: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
  }

  const tempDocs: TempDoc[] = [];

  for (const file of files) {
    const segments = file.relativePath.split('/');
    const fileName = segments[segments.length - 1];
    const isRootEntry = segments.length === 1 && fileName.toLowerCase() === entryFileName;

    let slug = '';
    if (!isRootEntry) {
      const cleanParts = segments.map((seg, idx) => {
        if (idx === segments.length - 1) {
          if (seg.toLowerCase() === entryFileName) return '';
          return cleanSegment(seg);
        }
        return cleanSegment(seg);
      }).filter(Boolean);
      slug = cleanParts.join('/');
    }

    const fullSlug = slug ? `/en/doc/${project.slug}/${slug}/` : `/en/doc/${project.slug}/`;
    const title = extractTitle(file.content, fileName);

    // Build breadcrumbs
    const breadcrumbs: Array<{ label: string; href?: string }> = [
      { label: project.title, href: `/en/projects/${project.slug}/` },
      { label: 'Documentation', href: `/en/doc/${project.slug}/` },
    ];

    if (!isRootEntry) {
      let accumSlug = '';
      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];
        const clean = cleanSegment(seg);
        accumSlug = accumSlug ? `${accumSlug}/${clean}` : clean;
        breadcrumbs.push({
          label: formatTitle(seg),
        });
      }
      breadcrumbs.push({ label: title });
    }

    tempDocs.push({
      rawPath: file.relativePath,
      slug,
      fullSlug,
      title,
      rawContent: file.content,
      breadcrumbs,
    });
  }

  // Quick lookup from rawPath to TempDoc
  const rawPathMap = new Map<string, TempDoc>();
  for (const td of tempDocs) {
    rawPathMap.set(td.rawPath, td);
  }

  // Build tree structure
  interface TreeNodeInternal {
    name: string;
    origName: string;
    isFolder: boolean;
    doc?: TempDoc;
    children: Map<string, TreeNodeInternal>;
  }

  const rootNodes = new Map<string, TreeNodeInternal>();

  for (const td of tempDocs) {
    const parts = td.rawPath.split('/');
    let currentLevel = rootNodes;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        const isEntry = part.toLowerCase() === entryFileName;
        if (isEntry && i > 0) {
          // Associated with current parent folder if any
        }
        currentLevel.set(part, {
          name: formatTitle(part), // filename-based label (e.g. "01-getting-started" → "Getting Started")
          origName: part,
          isFolder: false,
          doc: td,
          children: new Map(),
        });
      } else {
        if (!currentLevel.has(part)) {
          currentLevel.set(part, {
            name: formatTitle(part),
            origName: part,
            isFolder: true,
            children: new Map(),
          });
        }
        currentLevel = currentLevel.get(part)!.children;
      }
    }
  }

  function convertAndSort(level: Map<string, TreeNodeInternal>, currentRelPath = ''): DocsTreeNode[] {
    const entries = Array.from(level.values());
    entries.sort((a, b) => compareNames(a.origName, b.origName));

    const result: DocsTreeNode[] = [];
    for (const ent of entries) {
      const itemRelPath = currentRelPath ? `${currentRelPath}/${ent.origName}` : ent.origName;
      if (ent.isFolder) {
        result.push({
          type: 'folder',
          name: ent.name,
          path: itemRelPath,
          children: convertAndSort(ent.children, itemRelPath),
        });
      } else if (ent.doc) {
        result.push({
          type: 'file',
          name: ent.name,
          title: ent.doc.title,
          path: itemRelPath,
          slug: ent.doc.slug,
          fullSlug: ent.doc.fullSlug,
        });
      }
    }
    return result;
  }

  const tree = convertAndSort(rootNodes);

  // Depth-first traversal to produce sequential reading order
  const orderedDocs: TempDoc[] = [];
  function traverse(nodes: DocsTreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'file' && node.path) {
        const doc = rawPathMap.get(node.path);
        if (doc && !orderedDocs.includes(doc)) {
          orderedDocs.push(doc);
        }
      } else if (node.type === 'folder' && node.children) {
        traverse(node.children);
      }
    }
  }
  traverse(tree);

  // Re-write relative links and images in each doc, and render HTML
  const flatDocs: DocItem[] = [];
  const docsMap = new Map<string, DocItem>();

  for (let i = 0; i < orderedDocs.length; i++) {
    const td = orderedDocs[i];
    const prevDoc = i > 0 ? orderedDocs[i - 1] : undefined;
    const nextDoc = i < orderedDocs.length - 1 ? orderedDocs[i + 1] : undefined;

    // Relative links & image rewrite
    let processedMd = td.rawContent;

    // Rewrite markdown links: [text](path)
    processedMd = processedMd.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (origMatch, text, href) => {
        if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('#')) {
          return origMatch;
        }

        const [linkTarget, hash] = href.split('#');
        const hashSuffix = hash ? `#${hash}` : '';

        // Resolve link relative to current file's directory
        const docDir = path.dirname(td.rawPath);
        const resolvedRaw = path.normalize(docDir === '.' ? linkTarget : `${docDir}/${linkTarget}`);

        // Try exact match or match without extension
        const matched = rawPathMap.get(resolvedRaw) ||
          Array.from(rawPathMap.values()).find(
            (item) => item.rawPath === resolvedRaw || item.rawPath.replace(/\.(md|mdx)$/i, '') === resolvedRaw.replace(/\.(md|mdx)$/i, '')
          );

        if (matched) {
          return `[${text}](${matched.fullSlug}${hashSuffix})`;
        }

        // If target is root index or readme
        if (resolvedRaw === 'index.md' || resolvedRaw === 'README.md' || resolvedRaw === '.') {
          return `[${text}](/en/doc/${project.slug}/${hashSuffix})`;
        }

        return origMatch;
      }
    );

    // Rewrite relative images to GitHub raw
    processedMd = processedMd.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (origMatch, alt, src) => {
        if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
          return origMatch;
        }
        const docDir = path.dirname(td.rawPath);
        const resolved = path.normalize(docDir === '.' ? src : `${docDir}/${src}`);
        const docsPath = project.docs?.docsPath || 'docs';
        const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${docsPath}/${resolved}`;
        return `![${alt}](${rawUrl})`;
      }
    );

    const renderedHtml = await renderMarkdown(processedMd);

    const docItem: DocItem = {
      rawPath: td.rawPath,
      slug: td.slug,
      fullSlug: td.fullSlug,
      title: td.title,
      rawContent: processedMd,
      renderedHtml,
      prev: prevDoc ? { title: prevDoc.title, fullSlug: prevDoc.fullSlug } : undefined,
      next: nextDoc ? { title: nextDoc.title, fullSlug: nextDoc.fullSlug } : undefined,
      breadcrumbs: td.breadcrumbs,
    };

    flatDocs.push(docItem);
    docsMap.set(td.slug, docItem);
  }

  // Render project README
  const readmeHtml = readme ? await renderMarkdown(readme) : '';

  const projectDocs: ProjectDocs = {
    project,
    readmeHtml,
    tree,
    flatDocs,
    docsMap,
  };

  docsCache.set(project.slug, projectDocs);
  return projectDocs;
}

import { marked } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

async function getShiki(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        'bash',
        'shell',
        'sh',
        'c',
        'cpp',
        'python',
        'py',
        'json',
        'markdown',
        'md',
        'typescript',
        'ts',
        'javascript',
        'js',
        'html',
        'css',
        'text',
        'txt',
      ],
    });
  }
  return highlighterPromise;
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const shiki = await getShiki();

  // Process GitHub callout alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
  const processed = markdown.replace(
    /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n)?((?:>.*\n?)*)/gim,
    (_match, type, content) => {
      const alertType = type.toLowerCase();
      const cleanContent = content
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, ''))
        .join('\n');
      return `<div class="callout callout-${alertType}">\n<div class="callout-title">${type}</div>\n\n${cleanContent}\n</div>\n`;
    }
  );

  const renderer = new marked.Renderer();

  renderer.code = function ({ text, lang }) {
    const language = (lang || 'text').toLowerCase();
    const validLang = shiki.getLoadedLanguages().includes(language) ? language : 'text';
    try {
      return shiki.codeToHtml(text, {
        lang: validLang,
        theme: 'github-dark',
      });
    } catch {
      return `<pre><code class="language-${language}">${escapeHtml(text)}</code></pre>`;
    }
  };

  renderer.heading = function ({ text, depth }) {
    const cleanText = text.replace(/<[^>]*>/g, '');
    const slug = cleanText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    return `<h${depth} id="${slug}">${text}</h${depth}>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    renderer,
  });

  const parsed = await marked.parse(processed);
  // Wrap all tables in a responsive scroll container
  return parsed.replace(/<table>/g, '<div class="table-container"><table>').replace(/<\/table>/g, '</table></div>');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

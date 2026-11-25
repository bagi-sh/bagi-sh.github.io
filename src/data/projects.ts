export interface ExternalDocsConfig {
  repo: string; // ex: "bagi-sh/syncdap"
  branch?: string; // padrão: "main"
  docsPath?: string; // padrão: "docs"
  entryFile?: string; // padrão: "index.md"
  readmeFile?: string; // padrão: "README.md"
  localPath?: string; // caminho local para fallback em dev/build offline (ex: "../Syncdap")
}

export interface ProjectEntry {
  slug: string;
  title: string;
  description: string;
  repoUrl: string;
  category: 'audio' | 'tools' | 'kernel' | 'security';
  docs?: ExternalDocsConfig;
}

export const projects: ProjectEntry[] = [
  {
    slug: 'syncdap',
    title: 'Syncdap',
    description:
      'Modular Rockbox and Digital Audio Player (DAP) music library synchronization coordinator.',
    repoUrl: 'https://github.com/bagi-sh/syncdap',
    category: 'audio',
    docs: {
      repo: 'bagi-sh/syncdap',
      branch: 'main',
      docsPath: 'docs',
      entryFile: 'index.md',
      readmeFile: 'README.md',
      localPath: '../Syncdap',
    },
  },
];

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return projects.find((p) => p.slug === slug);
}

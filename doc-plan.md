# Tarefa: Sistema Genérico de Documentação Dinâmica via GitHub (`docs/`)

Analise primeiro a estrutura atual deste repositório (`package.json`, `astro.config.*`, `src/layouts/`, `src/pages/`, `src/content/` e estilos globais) para entender a versão do Astro, o sistema de estilização e os padrões de design já utilizados.

Em seguida, implemente uma arquitetura **totalmente genérica e reutilizável** para importar e renderizar, em tempo de compilação (*build time* para GitHub Pages), a documentação Markdown (`docs/`) de qualquer repositório externo do GitHub hospedado via `raw.githubusercontent.com`, **sem nenhum link ou repositório hardcoded nas páginas ou componentes**.

---

## 1. Registro Centralizado de Projetos (Config-Driven)

Crie uma fonte de dados tipada em TypeScript (ex.: `src/data/projects.ts` ou integrada à *Content Collection* de projetos já existente, caso haja) onde cada projeto possa habilitar documentação externa apenas declarando seus metadados:

```ts
export interface ExternalDocsConfig {
  repo: string;          // ex: "bagi-sh/Inkdroid"
  branch?: string;       // padrão: "main"
  docsPath?: string;     // padrão: "docs"
  entryFile?: string;    // padrão: "README.md" (ou "index.md")
}

export interface ProjectEntry {
  slug: string;          // ex: "inkdroid"
  title: string;
  description: string;
  repoUrl: string;
  docs?: ExternalDocsConfig;
  // ...demais campos já existentes no projeto
}
```

> **Requisito:** Adicionar a documentação de um novo repositório no futuro deve exigir **apenas** adicionar um item nessa configuração, sem criar novos arquivos `.astro` ou alterar rotas.

---

## 2. Serviço de Descoberta e Fetch (`src/lib/github-docs.ts`)

Implemente um módulo responsável por buscar e cachear a estrutura e o conteúdo dos arquivos Markdown durante o *build*:

1. **Descoberta automática de arquivos:**
   - Utilize a GitHub Git Trees API (`GET https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`) para listar todos os arquivos dentro de `docsPath` (incluindo subpastas aninhadas) em uma única chamada.
   - Filtre apenas arquivos `.md` / `.mdx` válidos.
2. **Download via Raw GitHub:**
   - Para cada arquivo encontrado, baixe o conteúdo bruto via `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{fullPath}`.
3. **Autenticação opcional e Cache:**
   - Suporte `GITHUB_TOKEN` via variável de ambiente (`import.meta.env.GITHUB_TOKEN` / `process.env.GITHUB_TOKEN`) no header `Authorization` quando disponível (evitando *rate limit* em dev/CI), mas funcione sem token para repositórios públicos.
   - Implemente cache em memória durante o ciclo de *build* para evitar requisições duplicadas entre `getStaticPaths` e a renderização das páginas.
   - Trate erros de rede ou repositórios sem pasta `docs/` de forma resiliente, exibindo avisos claros no log de build sem quebrar o restante do site.

---

## 3. Ordenação por Prefixo Numérico, Árvore e Pipeline Markdown

Os repositórios de documentação seguem uma convenção de nomenclatura com prefixos numéricos inteiros e decimais em pastas e arquivos (ex.: `01-getting-started/01-installation.md`, `01-getting-started/01.2-configuration.md`, `02-architecture/01-overview.md`). O sistema deve processar isso rigorosamente:

1. **Parser de Prefixos Numéricos & Ordenação Natural/Hierárquica:**
   - Extraia o prefixo numérico de cada diretório e arquivo (suportando inteiros e decimais como `01`, `01.2`, `02`, `10`).
   - Ordene irmãos em cada nível da árvore comparando os segmentos numéricos numericamente (`01` < `01.2` < `02` < `10`, nunca ordenação alfabética pura onde `10` vem antes de `2`). Itens sem prefixo numérico devem vir após os numerados, em ordem alfabética (exceto `README.md`/`index.md`, que representam a raiz do diretório).
   - **Slugs e Títulos limpos:** Remova o prefixo numérico ao gerar o slug da URL (ex.: `docs/01-getting-started/01.2-configuration.md` → rota `/projects/{project}/docs/getting-started/configuration`) e ao gerar títulos de fallback a partir do nome da pasta/arquivo (ex.: `01-getting-started` → `Getting Started`). Se houver `title` no frontmatter ou `# H1` no Markdown, priorize-os para o título da página.
2. **Construção da Árvore de Documentação (`DocsTree`):**
   - Monte uma estrutura de árvore recursiva (`folder` / `file`) espelhando exatamente a hierarquia de pastas e subpastas dentro de `docs/`.
   - Se uma subpasta contiver `index.md` ou `README.md`, associe essa página ao próprio nó da pasta para que ela seja clicável além de expansível.
3. **Reescrita de Links Relativos entre Documentos:**
   - Resolva links relativos do Markdown que apontam para caminhos físicos com prefixo (ex.: `./01.2-configuration.md`, `../02-usage/01-cli.md#flags`) e converta-os para as rotas limpas correspondentes do Astro (`/projects/{project}/docs/getting-started/configuration#flags`).
4. **Reescrita de Imagens e Assets Relativos:**
   - Converta caminhos relativos de imagens (ex.: `./assets/diagrama.png`, `../img/print.jpg`) para URLs absolutas apontando para `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{caminhoResolvido}`, garantindo que imagens carreguem sem precisar copiá-las para este site.
5. **Renderização:**
   - Utilize o pipeline Markdown nativo do Astro (ou `unified`/`remark`/`rehype` com suporte a GFM: tabelas, *task lists*, blocos de código com *syntax highlighting* e âncoras nos headings).

---

## 4. Roteamento Dinâmico, Sidebar em Árvore e Paginação

1. **Rotas Dinâmicas (`getStaticPaths`):**
   - Crie a rota dinâmica para páginas de documentação (ex.: `src/pages/projects/[project]/docs/[...slug].astro` ou seguindo o idioma das rotas atuais do site).
   - Garanta que a rota raiz `/projects/[project]/docs` carregue automaticamente o `entryFile` (`README.md` / `index.md` ou o primeiro documento da árvore ordenada).
2. **Sidebar Hierárquica (Tree / Index):**
   - Renderize a `DocsTree` completa na barra lateral como um índice em árvore recursivo: **as subpastas devem aparecer explicitamente na sidebar** como grupos/accordions expansíveis (com indicador visual de abrir/fechar e indentação por nível), abrindo automaticamente o caminho até a página ativa.
   - Destaque visualmente o item ativo e ofereça suporte responsivo (drawer/menu retrátil no mobile).
3. **Paginação Sequencial ("Anterior / Próxima Página"):**
   - Gere a sequência de navegação realizando uma travessia em profundidade (*depth-first traversal*) da árvore já ordenada.
   - Os botões de **"Página Anterior"** e **"Próxima Página"** no rodapé de cada artigo devem seguir exatamente essa ordem da árvore, atravessando subpastas de forma contínua (ex.: do último arquivo de `01-getting-started/` para o primeiro arquivo de `02-architecture/`).
4. **Table of Contents (ToC) & Vínculo com o GitHub:**
   - Sumário lateral gerado a partir dos headings (`h2`, `h3`) da página atual.
   - Link discreto *"Ver/Editar no GitHub"* apontando para o arquivo original (com seu caminho real no repositório).
   - Na listagem/página de cada projeto, exiba um botão/link para acessar sua documentação sempre que `project.docs` estiver configurado.

---

## 5. Critérios de Aceite

- Nenhum nome de repositório, URL do `raw.githubusercontent.com` ou caminho de arquivo específico *hardcoded* fora da configuração de projetos.
- Ordenação numérica/decimal (`01`, `01.2`, `02`, `10`) funcionando tanto na árvore da sidebar quanto nos botões de "Anterior / Próxima Página".
- Subpastas visíveis e navegáveis como nós hierárquicos (tree/index) na sidebar.
- Links relativos entre `.md` (mesmo referenciando nomes com prefixo numérico) e imagens relativas funcionando corretamente após o `astro build`.
- Código TypeScript estrito, limpo, bem modularizado e fiel ao design e tipografia existentes no site.

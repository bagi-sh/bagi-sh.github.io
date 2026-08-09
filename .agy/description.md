Abaixo encontra-se o escopo arquitetural e o planejamento detalhado para a implementação da primeira versão do seu sistema web, estruturado para atender aos requisitos de portfólio, microblog e documentação técnica, com suporte nativo a múltiplos idiomas.

  

### 1. Definição da Pilha Tecnológica (Stack)

A infraestrutura selecionada baseia-se estritamente em soluções de código aberto e hospedagem gratuita, adequadas para a publicação de documentações de software de baixo nível e cibersegurança:

  

- **Framework Principal:** Astro (Gerador de Sites Estáticos).
    
      
    
- **Linguagens:** HTML, CSS, um subconjunto mínimo de JavaScript/TypeScript para lógica de compilação, e Markdown para conteúdo textual.
    
      
    
- **Controle de Versão e CI/CD:** Git e GitHub Actions.
    
      
    
- **Hospedagem:** GitHub Pages (com vinculação posterior de domínio personalizado via GitHub Student Developer Pack).
    
      
    

### 2. Estrutura de Diretórios Proposta

A organização interna do repositório deve separar estritamente a lógica de roteamento (páginas) do conteúdo bruto (textos), garantindo a segmentação entre os idiomas suportados (Português e Inglês).

  

Plaintext

```
raiz_do_projeto/
├── public/                 # Ativos estáticos brutos (imagens, favicons, fontes)
├── src/
│   ├── content/            # Repositório de arquivos Markdown (Content Collections)
│   │   ├── docs/
│   │   │   ├── pt/         # Documentação de projetos (ex: ferramentas em C/C++)
│   │   │   └── en/
│   │   └── microblog/
│   │       ├── pt/         # Entradas cronológicas do feed
│   │       └── en/
│   ├── i18n/               # Dicionários de tradução para a interface estática
│   ├── layouts/            # Estruturas estruturais reutilizáveis (Base, Header, Footer)
│   └── pages/              # Roteamento baseado em arquivos
│       ├── pt/
│       │   ├── index.astro
│       │   ├── feed.astro
│       │   └── projetos/   # Páginas de portfólio com escopo de design isolado
│       │       └── projeto-alpha.astro
│       └── en/
│           ├── index.astro
│           ├── feed.astro
│           └── projetos/
│               └── project-alpha.astro
├── astro.config.mjs        # Configuração do compilador e integrações
└── package.json            # Gerenciamento de dependências
```

### 3. Especificação de Funcionalidades (Features)

**3.1. Sistema de Internacionalização (i18n)**

  

- **Roteamento:** Implementação de rotas estáticas separadas por prefixo de diretório (`/pt/` e `/en/`).
    
      
    
- **Interface:** Uso de um dicionário centralizado (`src/i18n/ui.js`) para injetar strings traduzidas nos componentes de navegação, dependendo da rota atual.
    
      
    
- **Redirecionamento:** O arquivo `src/pages/index.astro` (raiz absoluta) deve conter uma lógica de redirecionamento ou uma meta tag para encaminhar o usuário ao diretório `/pt/` por padrão.
    
      
    

**3.2. Módulo de Microblog (Feed)**

  

- **Armazenamento:** Arquivos `.md` isolados no diretório `microblog`.
    
      
    
- **Renderização:** Um loop no arquivo `feed.astro` encarregado de buscar os arquivos Markdown, ordená-los cronologicamente de forma decrescente utilizando os metadados do arquivo (frontmatter) e exibi-los em blocos contínuos.
    
      
    

**3.3. Módulo de Portfólio (Showcase)**

  

- **Isolamento Visual:** Cada projeto de portfólio terá seu próprio arquivo `.astro` dentro de `src/pages/[idioma]/projetos/`. O CSS declarado nestes arquivos será encapsulado automaticamente pelo Astro, impedindo o vazamento de estilos entre apresentações de projetos distintos.
    
      
    
- **Integração:** Inserção de hiperlinks nestas páginas que apontem diretamente para a seção correspondente na árvore de documentação.
    
      
    

**3.4. Módulo de Documentação Técnica**

  

- **Tipografia e Legibilidade:** Layout padronizado focado em leitura densa.
    
      
    
- **Destaque de Sintaxe:** Configuração do mecanismo interno do Astro (como o Shiki) para aplicar realce de sintaxe em blocos de código (particularmente focado em C, C++ e Bash).
    
      
    

### 4. Fases de Desenvolvimento

Para alcançar a primeira versão em produção (v1.0), a execução deve seguir uma ordem de dependência estrita:

  

1. **Fase de Inicialização:** Geração do projeto base através da interface de linha de comando (`npm create astro@latest`), limpeza de arquivos residuais e configuração do repositório Git local.
    
      
    
2. **Fase Estrutural:** Construção do componente `LayoutGlobal.astro`, contendo a estrutura base do documento HTML (`<head>`, `<nav>`, `<footer>`) e a lógica de importação do dicionário de idiomas.
    
      
    
3. **Fase de Roteamento Base:** Criação das rotas estáticas iniciais (`index.astro` e `feed.astro`) dentro dos respectivos subdiretórios de idioma.
    
      
    
4. **Fase de Integração de Conteúdo:** Configuração das _Content Collections_ no Astro para mapear e tipar os diretórios `docs/` e `microblog/`. Construção da lógica de listagem no feed.
    
      
    
5. **Fase de Portfólio:** Desenvolvimento das páginas individuais de portfólio, aplicando o isolamento de CSS necessário para cada layout customizado.
    
      
    
6. **Fase de Implementação (Deploy):** Configuração de um fluxo de trabalho (Workflow) no GitHub Actions que compile o projeto estaticamente a cada submissão (Push) na ramificação principal (main/master) e publique os artefatos resultantes no serviço GitHub Pages.
    
      
    

Para garantir a integridade dos dados durante a compilação, o framework Astro exige a definição de esquemas de tipagem para validar os metadados de arquivos Markdown (como datas, títulos e categorias). Como você planeja estruturar o cabeçalho (_frontmatter_) dos seus arquivos de microblog para assegurar que o sistema recuse a compilação de uma publicação caso uma informação essencial, como a data, seja omitida?
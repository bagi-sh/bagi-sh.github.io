# Relatório de Debloat e Simplificação

**Data:** 09/08/2026  
**Status:** Concluído com Sucesso

---

## 1. Resumo Executivo
Atendendo à solicitação de eliminação de código excessivo e *bloat*, todo o projeto foi refatorado para garantir o máximo de simplicidade, eliminação completa de scripts JavaScript client-side e limitação estrita aos idiomas `pt` e `en`.

---

## 2. Ações de Limpeza Realizadas

### 2.1. Simplificação do Sistema de Idiomas (i18n)
- **[src/i18n/ui.ts](file:///home/bagi/Projects/Bagi-sh.com/src/i18n/ui.ts):** Reduzido para pouquíssimas linhas contendo apenas as chaves essenciais da interface (`pt` e `en`). Eliminadas estruturas complexas e abstrações desnecessárias.

### 2.2. Consolidação de Componentes (Remoção de Arquivos Redundantes)
- Eliminado o arquivo `Nav.astro`. A navegação foi unificada diretamente dentro de [Header.astro](file:///home/bagi/Projects/Bagi-sh.com/src/components/Header.astro), reduzindo o número de arquivos e o aninhamento de componentes.
- **[Header.astro](file:///home/bagi/Projects/Bagi-sh.com/src/components/Header.astro)** e **[Footer.astro](file:///home/bagi/Projects/Bagi-sh.com/src/components/Footer.astro):** ReesประReescritos com HTML puro, sem scripts JS ou dependências externas.

### 2.3. Zero JavaScript Client-Side (Pure SSG)
- **[LayoutGlobal.astro](file:///home/bagi/Projects/Bagi-sh.com/src/layouts/LayoutGlobal.astro):** Estrutura HTML5 pura, sem inclusão de tags `<script>` ou frameworks no cliente. Todo o HTML é gerado no momento do build estático (`astro build`).

### 2.4. Mapeamento Enxuto de Conteúdo (Content Collections)
- **[src/content/config.ts](file:///home/bagi/Projects/Bagi-sh.com/src/content/config.ts):** Simplificado ao essencial para validação via Zod dos metadados de `microblog` e `docs`.

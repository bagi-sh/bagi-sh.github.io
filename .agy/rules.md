# Diretrizes de Desenvolvimento (Astro + SSG)

## Objetivo
Criar a estrutura base de arquivos (.astro, scripts em typescript e estruturas de dados) para um site estático multilíngue. O foco é fornecer a marcação HTML semântica e a lógica de roteamento/integração, deixando as classes CSS e estilização abertas para personalização manual.

## Regras de Comportamento do Agente
1. Não inclua frameworks CSS (Tailwind, Bootstrap, etc.) a menos que solicitado.
2. Utilize elementos HTML5 totalmente semânticos (<header>, <main>, <nav>, <article>, <section>, <footer>).
3. Mantenha os arquivos `.astro` limpos, fornecendo seletores CSS de classe ou ID lógicos (ex: `class="feed-card"`, `class="project-header"`) para facilitar a estilização posterior.
4. Toda a lógica de servidor (Data Fetching / Content Collections) deve residir estritamente no frontmatter (bloco `---`) das páginas ou componentes.
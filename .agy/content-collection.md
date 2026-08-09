## Mapeamento do Content Collections (src/content/config.ts) 

Configure dois esquemas principais utilizando `astro:content`: 
1. **Microblog (`blog`)**: 
- `title`: string (opcional) 
- `pubDate`: date (obrigatório)
- `tags`: array de strings (opcional) 

1. **Documentação (`docs`)**: 
- `title`: string (obrigatório) 
- `description`: string (obrigatório) 
- `order`: number (para ordenação no menu lateral)
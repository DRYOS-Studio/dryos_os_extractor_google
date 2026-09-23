## Gerar SVG vetorizado da logo EXTRATOR N1

Recriar a logo enviada (quadrado indigo arredondado com alvo/círculos concêntricos brancos) como SVG limpo e escalável, salvo em `/mnt/documents/` para download.

### O que será feito

1. Criar `/mnt/documents/extrator-n1-logo.svg` com:
   - `viewBox="0 0 512 512"` (escala infinita, sem perda).
   - Quadrado de fundo com `rx` grande (cantos arredondados) preenchido em indigo (`#4F46E5`, alinhado ao `--primary` do app).
   - 4 círculos concêntricos brancos (stroke) + ponto central preenchido, formando o alvo/mira.
   - Sem textos ou raster embutidos — apenas paths/shapes.

2. Entregar o arquivo via `<presentation-artifact>` para download direto.

### O que NÃO muda

- Nenhum arquivo do projeto (código, assets, `public/`, `src/`) é alterado.
- A logo atual do app permanece como está.

### Observação técnica

É uma **reconstrução vetorial** baseada no PNG enviado (não um autotrace), então fica geometricamente perfeita e editável. Se quiser cor diferente do indigo, é só pedir depois.

# Aplicação da identidade Craft Brand

## Decisão vigente — 12/11/2026

Durante a implementação, o usuário pediu cuidado com a aplicação da marca sobre o fundo preto e escolheu expressamente: **“Marca branca, sem placa, preservando o desenho oficial”**. Essa decisão substitui a placa branca do Figma na interface escura.

## Regras por contexto

| Contexto | Aplicação |
|---|---|
| Abertura, fundo #1B1B1D | Assinatura branca, sem placa, 280 px de largura no viewport de referência |
| Cabeçalho, painel #242426 | Mesma assinatura branca, 116 px de largura; área livre original preservada |
| Sobre e créditos | Mesma assinatura branca, 220 px; redução proporcional em etapas de leitura ampliada |
| Prancha clara exportada | Assinatura preta original, sem inversão, com área branca de apoio |
| Prévia do arquivo carregado | O arquivo do usuário mantém as cores escolhidas; não é a identidade do aplicativo |

## Arquivos e invariantes

- `public/assets/craft-brand.svg`: cópia byte a byte do SVG oficial em contornos, sem alterações.
- `public/assets/craft-brand-negativo.svg`: derivado de aplicação que muda somente o preenchimento `#000000` para `#FFFFFF`. Não houve nova composição tipográfica, redesenho, espessamento, contorno adicional, recorte, sombra ou filtro CSS.
- ViewBox, proporção 1007:340, posições relativas, letras, traçados e espaço vazio interno são idênticos aos do mestre. O espaço interno fornecido é conservado como área de proteção; não foi inventada uma unidade normativa de manual de marca.
- A identidade Craft Brand não recebe as transformações de cinza/preto/branco do editor. Elas atuam apenas sobre o logotipo carregado. O novo “Forma Pharma”, criado a pedido do usuário, permanece identificado como exemplo.

O arquivo original tem SHA-256 `eb90ee1c5eae2069e3bdebf322c10b345442cc246f80e9d3674756644ffe878d`. O script `node scripts/audit-brand.mjs` verificou igualdade com o mestre, mudança exclusiva de preenchimento na versão negativa, proporção efetiva dos três usos na interface, ausência de placa/filtro e pixels pretos do logo na prancha clara.

Evidências: `docs/marca/abertura.png`, `editor.png`, `creditos.png`, `prancha.png` e `validacao.json`. As capturas são do aplicativo real. A decisão não altera o documento Figma online, que permanece intacto como referência de origem.

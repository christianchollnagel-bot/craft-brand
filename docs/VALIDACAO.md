# Validação — Craft Brand

Data: 12/11/2026. Aplicação executada localmente em Windows, com Google Chrome por Playwright e inspeção interativa no navegador integrado do Codex. Node.js 24.19.0. Não foram utilizados aparelhos físicos, Safari ou Firefox.

## Resultado

Os 44 estados foram contemplados por fluxos reais e cenários controlados de teste. Os 17 testes de navegador e os 2 testes de estado passaram, incluindo a ampliação do limite para 50 MB. Nenhum erro de JavaScript ocorreu no percurso principal. O seletor de arquivos é nativo: seu acionamento e cancelamento foram verificados, sem fabricar a tela do sistema operacional.

| Verificação | Resultado observado |
|---|---|
| 360 × 640, 393 × 699, 412 × 732 e 360 × 560, texto padrão | 18 vistas por tamanho: documento sem scroll, controles dentro do viewport, painéis sem overflow e ações sem encobrimento |
| Entrada e processamento | PNG/SVG reais, exemplo local, cancelamento, validação antes da troca, preservação da sessão em erros |
| Limite de 50 MB | PNG real acima de 10 MiB importado e exportado com alfa; SVG válido de exatamente 50 MiB aceito; 50 MiB + 1 byte rejeitado com a sessão anterior preservada |
| Estado | Rascunho, Aplicar, Cancelar, Desfazer, Refazer, ramificação do histórico, restauração reversível e retorno à aba de origem |
| Cor | HEX dedicado e físico, entrada sem cerquilha, erro com última cor válida preservada, matiz com cancelamento reversível |
| Aparência | Preto permanece preto no cinza; cores viram diferentes níveis de cinza; alfa preservado nas monocromias |
| Fundo preto | Marca preta permanece preta, sem inversão automática; PNG opaco conserva seu fundo incorporado |
| Prévia PNG | Arquivo válido de 1080 × 1080; alfa zero nas margens transparentes, conteúdo no centro e ausência do quadriculado |
| Prancha | Seleção parcial funcional; geração bloqueada sem seções; miniatura do Blob efetivamente gerado |
| Redução | PNG vertical de 1080 × 8122; pixels medidos confirmam larguras de 256, 128, 64 e 32, com proporção preservada |
| Falhas | Formato, tamanho do arquivo, corrupção, SVG externo/ativo, dimensões excessivas, imagem vazia, falha do exemplo e falha de Blob com recuperação |
| Download | Solicitação real, alternativa por Blob, falha de acionamento recuperável e clique duplo sem download duplicado |
| Acessibilidade | Nomes dos ícones, foco visível, Escape, retorno de foco do diálogo, abas por teclado e escala por teclas |
| Texto a 200% em 360 × 640 | Início/créditos com etapas; editor, painéis, HEX, comparações, exportação em etapas, resultado e alternativa de download com ações alcançáveis |
| Identidade | Mestre preservado; variante branca altera só preenchimentos, sem placa, filtro ou distorção na interface escura; original preto na prancha clara |

As verificações de layout examinam os limites reais dos elementos e o conteúdo interno; não dependem de `overflow:hidden` para ocultar ações. As medições de texto ampliado estão em `texto-ampliado.json`. São testes de cenários específicos, não certificação completa de acessibilidade.

## Comparação visual

Foram examinadas capturas e propriedades do documento online atual, com 44 quadros de 360 × 640. As 43 capturas da aplicação em `capturas/01.png` e `03.png` a `44.png` acompanham o fluxo real; a tela 02 é o seletor nativo. As 11 folhas em `comparacoes/` colocam Figma à esquerda e aplicação à direita de cada par. Elas registram estados funcionais, por isso ajustes e seleções podem diferir dos valores demonstrativos do Figma.

Os dez pares em `comparacoes/area-util/` comparam a mesma área útil de 360 × 600: foram retirados somente os 24 px de status e os 16 px de gesto das referências. A aplicação não desenha essas barras. Foram conferidos abertura, editor, Fundos, cor personalizada, teclado HEX, ferramentas, aparência e os três modos de comparação.

Foram ajustados cabeçalho, proporção da identidade, painéis, miniaturas, dimensões das amostras, seleção, cor, escala, menu e composição da prancha. Manrope local foi carregada e conferida. Não se declara identidade pixel a pixel: rasterização do texto no navegador, área disponível e estados derivados do arquivo produzem diferenças.

Diferenças intencionais:

- A marca branca sem placa foi escolhida expressamente pelo usuário durante a execução e prevalece sobre a placa do Figma. Ver `APLICACAO_DA_MARCA.md`.
- O limite de arquivo foi ampliado de 10 para 50 MB a pedido do usuário; a proteção por dimensões continua ativa.
- Histórico, seleção de seções, opacidade, origem da navegação e miniaturas respondem à sessão real. Não são destinos ou imagens fixas do protótipo.
- O cinza é calculado por pixel; não reproduz uma eventual recoloração uniforme do mockup.
- Preparação dura somente o trabalho real, sem percentual fictício ou espera imposta.
- A faixa de matiz tem área de interação ampliada. Em texto ampliado, detalhes e ações podem aparecer em etapas, com retorno pelo cabeçalho.
- A prancha tem altura calculada e preserva as medidas de redução. A miniatura pode encolhê-la, mas o PNG não é redimensionado depois.

## Comandos e evidências

Comandos executados nesta pasta:

```powershell
npm install
npm run test:unit
npm test
node scripts/audit-brand.mjs
node scripts/audit-text-200.mjs
node scripts/audit-expanded.mjs
node scripts/contact-sheets.mjs
node scripts/compare-useful.mjs
npm run build
```

- `validacao-resultados.json`: relatório Playwright da última execução completa.
- `marca/validacao.json`: igualdade do mestre, mudança exclusiva de preenchimento e geometria dos usos da marca.
- `marca/abertura.png`, `marca/editor.png`, `marca/creditos.png`: aplicação branca no aplicativo.
- `marca/prancha.png`: PNG real com as três seções e identidade preta.
- `capturas/download-prancha.png`: download real de seleção parcial.
- `capturas/previa-transparente.png`: PNG com alfa.
- `capturas/reducao-vertical.png` e `medidas-reducao.json`: prova vertical e coordenadas das medidas verificadas diretamente nos pixels.
- `texto-ampliado.json`: limites dos elementos com raiz tipográfica em 32 px.

Fixtures sintéticas são identificadas em `tests/fixtures/LEIA-ME.md`. As injeções de falha existem somente nos testes, sem controles ocultos de simulação no aplicativo distribuído.

## Limites e pendências reais

Integrantes e contribuições permanecem “a preencher”, pois esses dados não foram fornecidos. O .fig local foi preservado, sem alegar sua interpretação; a referência acessada foi o documento online.

O teclado móvel e o diálogo de salvar dependem do navegador. `inputmode=none` solicita a ausência do teclado do sistema, mas não substitui um teste em iOS/Android. Não foi realizado teste com leitor de tela ou uma matriz completa de zoom, orientação e fontes. A sessão é mantida durante o uso, não entre recarregamentos.

Importação e saída têm os limites de memória documentados em `IMPLEMENTACAO_FIGMA.md`. SVG ativo, dependências externas e grafos de `use` aninhados não são aceitos; arquivos estáticos autocontidos compatíveis funcionam. Uma proporção extrema que exceda os limites da prancha causa erro recuperável, em vez de falsificar as larguras da prova.

A distribuição estática fica em `dist/`; o ZIP contém somente seus arquivos de execução e a licença da fonte. A abertura de `http://127.0.0.1:5186/dist/index.html`, o exemplo local e a geração da prancha de três seções (1080 × 1162) foram verificados interativamente no navegador integrado. O aplicativo deve ser servido por HTTP/HTTPS, não aberto por `file://`.

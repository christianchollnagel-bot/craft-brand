# Forma Pharma — novo exemplo do editor

Criado em 12/11/2026 por solicitação do usuário: logotipo de teste mais moderno, nítido e associado ao setor farmacêutico. É uma marca fictícia de demonstração, distinta da identidade oficial Craft Brand.

## Direção e escolha

Foram desenhadas duas rotas: cápsula com cruz vazada e conexão molecular. A cápsula foi selecionada pela associação direta com medicamentos e por continuar identificável em uma tinta. A alternativa molecular é mais abstrata e dependia de detalhes menores. O estudo comparativo está em `exemplo/rotas.png`; não houve pesquisa com público nem aprovação externa.

A assinatura usa formas arredondadas, nome em Manrope 650 e descritor espaçado em Manrope 600. Cores: azul-petróleo `#153F43`, teal `#087F8C` e verde `#53C4A5`. A cruz é vazada com transparência real, sem um quadrado branco incorporado. Na versão monocromática, a silhueta e o vazado permanecem.

A consulta preliminar à [identidade da Hovione](https://www.hovione.com/hoviones-new-brand) mostrou o uso de cápsulas combinado com um H e hexágono. Essa composição não foi reproduzida. A fonte serviu para observar a linguagem da categoria. Não se afirma exclusividade ou disponibilidade de registro para o nome/símbolo de demonstração.

## Arquivos

- `public/assets/forma-pharma.svg`: SVG de produção, 1200 × 800, letras em contornos, sem bitmap ou fonte externa. É o exemplo carregado pelo aplicativo.
- `docs/exemplo/forma-pharma-2400.png`: PNG transparente em 2400 × 1600.
- `docs/exemplo/forma-pharma-editavel.svg`: versão com texto editável; depende da Manrope fornecida em `public/assets` para edição fiel.
- `docs/exemplo/forma-pharma-preto.svg` e `forma-pharma-branco.svg`: simulações de uma tinta para conferência.
- `docs/exemplo/aplicacoes.png`: prova em fundo claro, preto e branco.
- `docs/exemplo/editor.png`: aplicação real no editor.
- `docs/exemplo/rota-molecular.svg` e `rotas.png`: alternativa e comparação.

O `forma.svg` original exportado do Figma permanece preservado. A identidade Craft Brand e sua aplicação branca sem placa não foram alteradas.

## Produção e nitidez

O desenho foi produzido diretamente em SVG. A tipografia foi convertida em curvas da Manrope local com [Fontkit](https://github.com/foliojs/fontkit), utilizado somente na preparação dos assets. Não há dependência dessa biblioteca no navegador nem raster incorporado no SVG. A licença da fonte permanece em `public/assets/OFL-Manrope.txt`.

O editor agora rasteriza SVGs até 2048 px de lado maior, mesmo que o viewport declarado do vetor seja pequeno. O original permanece intacto. PNGs não são ampliados artificialmente nessa etapa. Essa mudança evita uma superfície intermediária pequena que antes podia deixar a prévia e a exportação borradas.

Testes visuais: aplicações colorida, preta e branca, editor, comparação e redução. O descritor PHARMA perde leitura nos menores tamanhos; isso é visível na prova e não representa certificação de legibilidade. O teste de exportação de um SVG com viewport de 24 × 24 verifica bordas nítidas em PNG de 1080 × 1080.

Para regenerar os arquivos, após `npm ci`, execute `node scripts/design-example.mjs`. Com o servidor local ativo, `node scripts/render-example.mjs` gera o PNG e as pranchas de conferência.

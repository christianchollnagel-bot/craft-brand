# Craft Brand — implementação do Figma

Data: 12/11/2026. Inovação Chris 2026/2 — Atividades 4 e 5.

## Inventário verificado

A pasta inicial continha somente `Craft Brand — Mobile · UX_UI V02.fig` (339.348 bytes), `Craft_Brand_Logotipo_Pacote.zip` e `Craft_Brand_Mockups_V02.zip`. Não havia aplicação, package.json, AGENTS.md local nem repositório Git. Os três originais foram preservados. Os pacotes foram extraídos em `materiais/logotipo` e `materiais/mockups`.

O pacote da marca contém SVG em contornos, PNG transparente, PNG branco, SVG de texto editável, Manrope variável TTF e sua licença OFL. A aplicação utiliza cópias do SVG em contornos e da fonte original em `public/assets`.

Os mockups são 11 pranchas raster, quatro estados por prancha, com um catálogo HTML que não é aplicativo. O guia online informa a adaptação da versão anterior 390 × 844 para 360 × 640. As pranchas antigas são apoio e não são utilizadas como interface nem exportação.

O arquivo .fig foi preservado, mas não interpretado. Não é possível afirmar sua correspondência com a revisão atual a partir da extensão. A referência implementada é o documento online consultado pela integração oficial.

## Referências consultadas

- [Documento oficial](https://www.figma.com/design/H0i4zEf8MKSDJrWznGVJP8).
- [Página das 44 telas, 2:2](https://www.figma.com/design/H0i4zEf8MKSDJrWznGVJP8?node-id=2-2): metadados confirmaram os 44 quadros 360 × 640.
- [Sistema visual, 2:28](https://www.figma.com/design/H0i4zEf8MKSDJrWznGVJP8?node-id=2-28).
- [Guia 9:16, 28:960](https://www.figma.com/design/H0i4zEf8MKSDJrWznGVJP8?node-id=28-960).

Foram consultados contextos de design dos 44 estados. Cópias técnicas estão em `docs/referencias` para rastreabilidade; não entram na distribuição. As capturas de referência representam o aparelho, incluindo 24 px de status e 16 px de gesto. A aplicação utiliza a área real, sem desenhar esses elementos do sistema. A comparação deve descontar esse acabamento.

O exemplo `forma.svg` foi exportado sem redesenho do nó 8:145 (instância Exemplo/forma/original) com texto convertido em contornos pela exportação do Figma. O SVG exportado tem 263 × 179; o arredondamento do exportador em relação à instância fracionária foi preservado. Ícones back, undo, redo, more, close e check foram exportados de instâncias reais. A marca oficial foi copiada sem alteração do pacote local.

### Atualização aprovada durante a execução

O usuário escolheu a **marca branca diretamente sobre o fundo escuro, sem placa**. A aplicação final usa `craft-brand-negativo.svg` na abertura, no cabeçalho e nos créditos. Essa variante altera exclusivamente o preenchimento do SVG oficial; preserva geometria e área livre. A prancha clara mantém o original preto. Essa decisão posterior prevalece sobre a placa branca inicialmente prevista no Figma. Ver `APLICACAO_DA_MARCA.md` e evidências em `docs/marca`.

## Arquitetura e decisões

HTML, CSS e JavaScript ES Modules, sem framework nem dependências em produção. Node.js serve arquivos e copia a distribuição; não há bundler. Playwright e pngjs existem apenas para verificações de navegador e pixels de PNG. Não há conta, backend, telemetria, upload ou dependência externa durante o uso.

- `src/state.js`: arquivo, ajustes confirmados, rascunho, transações completas, cursor de histórico, painel, aba, pilha de origens e exportação.
- `src/image.js`: validação de conteúdo, decodificação, transformações e compositor comum.
- `src/limits.js`: limite de arquivo compartilhado pela validação e pelos textos da interface, além dos limites de processamento.
- `src/export.js`: PNG da área de prévia e prancha com provas exatas.
- `src/app.js`: interface semântica e eventos; seletor real, diálogos nativos, foco e recuperação.
- `src/styles.css`: tokens oficiais, Manrope, composição flexível, teclado HEX e adaptações.

Abrir painel cria rascunho; Aplicar confirma uma transação, Cancelar/Escape/Fechar descartam. Nova alteração após Desfazer elimina o ramo de Refazer. Restauração é transação reversível. Novo arquivo é decodificado antes de substituir a sessão ou pedir confirmação de perda de ajustes. Falhas mantêm a sessão anterior. Comparações/exportação/créditos não criam histórico.

HEX aceita teclado físico e colagem. `inputmode=none` solicita ausência do teclado do sistema; teclado dedicado 6 × 3. Última cor válida é mantida, Aplicar fica desabilitado durante erro. O comportamento final de teclados móveis depende do navegador e não equivale a teste em aparelho físico.

## Imagens e limites

O limite de arquivo passou de 10 para 50 MiB (interface: “50 MB”), a pedido do usuário. Permanecem os limites de 16 milhões de pixels e até 8.192 px por lado na importação. A superfície de trabalho derivada tem lado maior de até 2.048 px; o arquivo original e suas margens são preservados. Imagens não são recortadas. Limites protegem a memória e falhas de Canvas são recuperáveis.

PNG é identificado pela assinatura e IHDR; SVG é analisado como XML. Scripts, eventos, HTML embutido e animações são rejeitados. Referências externas e CSS que possa ocultá-las são rejeitados; referências internas e imagens/fontes base64 compatíveis são admitidas. SVG não confiável nunca é inserido no DOM da interface: é decodificado como imagem por Blob. Símbolos `use` aninhados são rejeitados para evitar grafos cíclicos de renderização. SVG compatível significa documento estático autocontido; textos podem depender das fontes incorporadas ou disponíveis no navegador.

Cinza usa luminância por pixel (0,2126 R + 0,7152 G + 0,0722 B). Preto e branco mudam apenas RGB. Alfa permanece intacto. PNG opaco continua opaco. A detecção de opacidade e conteúdo visível ocorre na rasterização de dimensões originais, antes da redução da superfície de trabalho. Imagens PNG/JPEG embutidas em SVG também têm dimensões e soma de pixels verificadas antes da decodificação do SVG.

Prévia exportada: área quadrada da composição do editor, 1080 × 1080, com fundo e escala escolhidos, sem interface ou quadriculado. A proporção do logotipo é preservada dentro dela. O formato 9:16 pertence apenas à interface.

Prancha: largura de 1080 px, altura calculada por seções; fundo opaco, logo oficial e rótulos. As amostras de redução são desenhadas com larguras 256, 128, 64 e 32 no arquivo PNG, sem redimensionar a prancha depois. Limite de saída: 16 milhões de pixels e 16.384 px por lado; proporções extremas que excedam isso produzem falha recuperável com orientação, sem exportar medidas falsas.

O resultado é um Blob PNG real. URLs são mantidas enquanto a página está em uso para permitir abrir/baixar mesmo depois de uma tentativa anterior; todas são liberadas ao sair da página. O download registra solicitação, sem alegar pasta ou conclusão do salvamento.

## Fontes técnicas

O tratamento de SVG como imagem e suas restrições foram conferidos na [documentação MDN de SVG como imagem](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image). A geração de Blob e os limites dependentes do navegador foram conferidos em [Canvas.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) e [elemento Canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas).

## Pendências conhecidas de conteúdo

Integrantes e contribuições não fornecidos: permanece “a preencher”. Não foram inventados nomes, cargos ou vínculo oficial com Google/Snapseed.

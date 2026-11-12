# Mapa dos 44 estados

Todos os estados compartilham sessão, ajustes e recursos. A interface não é um slideshow. Fluxos de erro artificialmente controlados existem apenas no código dos testes, sem chave de desenvolvimento publicada.

Referência: [44 telas no Figma](https://www.figma.com/design/H0i4zEf8MKSDJrWznGVJP8?node-id=2-2). A aplicação negativa da marca na interface escura foi escolhida pelo usuário durante a execução; ver [Aplicação da marca](APLICACAO_DA_MARCA.md).

| Nº | Estado | Nó | Componente / estado real | Como reproduzir e verificar |
|---|---|---|---|---|
| 01 | Início | 8:12 | welcome | Abrir a URL sem sessão. |
| 02 | Selecionar arquivo | 8:47 | input file nativo | Abrir logotipo / ABRIR. Teste verifica evento filechooser, seleção e cancelamento reais. Sem lista fictícia e sem captura simulada do sistema. |
| 03 | Preparando o logotipo | 8:82 | busy / importFile | Leitura e decodificação pendentes; teste mantém o fetch do exemplo pendente até observar a mensagem. |
| 04 | Exemplo aberto | 8:101 | Session.replace + editor | Experimentar com exemplo; forma.svg local e aviso de exemplo. |
| 05 | Transparência | 8:164 | settings.background | Fundos → Transparente → Aplicar. |
| 06 | Fundo branco | 8:222 | settings.background | Fundos → Branco → Aplicar. |
| 07 | Fundo preto | 8:277 | settings.background | Fundos → Preto → Aplicar. Cores da marca preservadas, sem inversão. |
| 08 | Fundo personalizado | 8:332 | settings.background/color | Fundos → Sua cor → Aplicar. |
| 09 | Painel Fundos | 9:165 | panel(backgrounds) | FUNDOS; rascunho e quatro opções reais. |
| 10 | Cor personalizada | 9:254 | hex-row | Sua cor, antes de focar o campo. |
| 11 | Cor inválida e entrada HEX | 9:344 | editingHex / validHex | Digitar #ZZ12; Aplicar desabilitado, última cor válida na prévia; corrigir pelo teclado 6 × 3. |
| 12 | Ferramentas | 9:491 | panel(tools) | FERRAMENTAS; grade de seis ferramentas. |
| 13 | Aparência original | 9:589 | draft.appearance | Ferramentas → Aparência → Original. |
| 14 | Tons de cinza | 9:687 | transform(gray) | Aparência → Tons de cinza; luminância por pixel, alfa preservado. |
| 15 | Monocromático preto | 9:785 | transform(black) | Aparência → Preto; RGB preto e mesmo alfa. |
| 16 | Monocromático branco | 9:883 | transform(white) | Aparência → Branco; RGB branco e mesmo alfa. |
| 17 | Escala 25% | 10:485 | draft.scale | Escala; Home ou controle até 25%. |
| 18 | Escala 100% | 10:564 | draft.scale | Escala; End ou controle até 100%. |
| 19 | Ver original | 10:643 | original temporário | Ferramentas → Original; Voltar à prévia preserva ajustes. |
| 20 | Menu Mais | 10:702 | dialog.more-dialog | Mais; menu ancorado ao cabeçalho, Escape e devolução de foco. |
| 21 | Comparar fundos | 10:770 | comparison(backgrounds) | Ferramentas → Comparar; três amostras iguais em branco/preto/personalizado. |
| 22 | Comparar versões | 10:819 | comparison(versions) | Aba Versões, 2 × 2, fundo comum #B8B8B8. |
| 23 | Teste de redução | 10:873 | comparison(reduction) | Aba Redução; 256/128/64/32 px. Fixture vertical ativa alternância e aviso de ajuste. |
| 24 | Aviso de PNG opaco | 10:923 | modal de opacidade | Importar opaco.png; Continuar ou Escolher outro arquivo. |
| 25 | Exportar prévia | 11:674 | exportView(preview) | EXPORTAR → Prévia. |
| 26 | Exportar prancha | 11:709 | exportView(board) | EXPORTAR → Prancha ou Exportar comparação. |
| 27 | Nenhum teste selecionado | 11:754 | export.sections vazio | Desmarcar as três seções; mensagem e geração bloqueada. |
| 28 | Preparando o PNG | 11:790 | export.status preparing | Gerar PNG; teste retém callback de Canvas.toBlob enquanto a geração está pendente. |
| 29 | Imagem pronta | 11:814 | resultView(ready) | Blob válido gerado; miniatura é o próprio resultado. |
| 30 | Download solicitado | 11:917 | resultView(requested) | Baixar PNG; teste recebe e decodifica o arquivo real. Sem alegação de pasta salva. |
| 31 | Falha na exportação | 11:1020 | ERRORS.export | Teste substitui toBlob por callback null. Nova tentativa funciona, preservando sessão. |
| 32 | Download indisponível / Abrir imagem | 11:1042 | resultView(unavailable) | Exceção controlada em anchor.click ou link Não iniciou o download?; Abrir imagem mantém URL válida. |
| 33 | Confirmar troca | 12:815 | modal + candidato validado | Com ajustes, escolher arquivo válido. Manter atual ou Escape descarta candidato, preserva sessão. |
| 34 | Confirmar restauração | 12:881 | modal + commit(DEFAULTS) | Mais → Restaurar ajustes; restauração pode ser desfeita. |
| 35 | Ajuste desfeito | 12:944 | Session.undo + toast | Após Aplicar, Desfazer. Restaura o estado completo. |
| 36 | Ajuste refeito | 12:1001 | Session.redo + toast | Refazer; novo ajuste após Desfazer elimina ramo antigo. |
| 37 | Formato incompatível | 12:1061 | ImageError(format) | Fixture incompativel.pdf, assinatura não aceita. |
| 38 | Arquivo acima do limite | 12:1083 | ImageError(size) | Arquivo sintético com 50 MiB + 1 byte criado pelo teste. |
| 39 | Arquivo corrompido | 12:1105 | ImageError(corrupt) | corrompido.svg ou falha de decodificação; conteúdo ativo também rejeitado com detalhe específico. |
| 40 | Recursos externos do SVG | 12:1127 | ImageError(external) | externo.svg e CSS @import externo; nenhuma requisição externa disparada. |
| 41 | Imagem grande demais | 12:1152 | ImageError(dimensions) | muito-grande.svg; teste adicional de imagem embutida excessiva. |
| 42 | Arquivo sem conteúdo visível | 12:1174 | ImageError(empty) | vazio.png, alfa zero em toda a imagem. |
| 43 | Falha ao abrir o exemplo | 12:1196 | ImageError(example) | Teste aborta fetch local do exemplo; recuperação por arquivo próprio funciona. |
| 44 | Sobre e créditos | 12:1220 | aboutView / origins | Início ou Mais → Sobre; volta à origem, conteúdo em etapas quando ampliado, nomes a preencher. |

## Evidências

Os contextos e as 44 capturas do Figma estão em `docs/referencias`. Há 43 capturas da aplicação numeradas 01–44 em `docs/capturas`; o estado 02 é o seletor real do sistema e foi exercitado pelo evento filechooser e entrada de arquivo, sem inventar uma tela HTML ou uma captura dele. Os arquivos de saída PNG nessas pastas são resultados reais dos testes.

`tests/app.spec.js` percorre os estados e comportamentos principais; `tests/robustness.spec.js` cobre teclado físico, texto ampliado, falha de download, repetição de cliques, recursos embutidos e proporções extremas. `tests/state.test.mjs` verifica transações e retorno de navegação. Os resultados observados estão em `VALIDACAO.md`.


# Craft Brand

Aplicação web local para testar logotipos em fundos, aparências e tamanhos e exportar PNGs. Projeto Inovação Chris 2026/2 — Atividades 4 e 5.

## Abrir

Com Node.js 22 ou superior, abra um terminal na pasta do projeto e execute:

```powershell
npm start
```

Acesse **http://127.0.0.1:5186**. O servidor escuta apenas o próprio computador. Caso a porta esteja ocupada, use `$env:PORT=5187; npm start` e acesse a nova porta. Não é necessário instalar pacotes para abrir ou gerar a distribuição. Não abra o HTML por `file://`: módulos e recursos locais precisam de HTTP.

O botão **Experimentar com exemplo** carrega o **Forma Pharma**, exemplo farmacêutico criado em SVG com letras em contornos. **ABRIR** usa o seletor real do sistema, com PNG e SVG até 50 MB. Os arquivos são processados no navegador, sem envio a servidores. A sessão permanece durante navegação e redimensionamento; recarregar a página a encerra.

## Usar

- **FUNDOS**: transparência, branco, preto e Sua cor. Use a faixa de matiz ou toque no HEX para abrir o teclado dedicado; também aceita teclado físico e colagem.
- **FERRAMENTAS**: aparência original, cinza, preto e branco; escala de 25–100%; original temporário e comparações.
- **Cancelar/Fechar/Escape** descartam o ajuste provisório; **Aplicar** confirma uma transação. Desfazer/Refazer também aceitam Ctrl+Z/Ctrl+Shift+Z.
- **Mais** contém restauração reversível e créditos.
- **EXPORTAR** gera a prévia ou uma prancha com as seções selecionadas. **Baixar PNG** solicita o download; **Abrir imagem** é a alternativa disponível após a solicitação ou falha. O aplicativo não consegue confirmar a pasta de salvamento.

Marcas muito verticais usam alternância de amostras na prova de redução. Uma amostra reduzida para caber é identificada; o PNG mantém as larguras reais anunciadas. Monocromias são simulações e não removem fundos opacos incorporados.

## Distribuição

```powershell
npm run build
node scripts/serve.mjs --dist
```

Hospede **todo o conteúdo de `dist/`** em qualquer servidor estático HTTP/HTTPS. Não há backend, framework ou dependências de execução. O pacote entregue é **Craft_Brand_Web_9x16.zip** e contém somente essa distribuição. Fontes, ícones, logo e exemplo funcionam sem serviços externos.

## Verificações de desenvolvimento

```powershell
npm ci
npm run test:unit
npm test
```

Os testes usam o Google Chrome instalado em `C:/Program Files/Google/Chrome/Application/chrome.exe`. Para outro ambiente, ajuste `launchOptions.executablePath` em `playwright.config.js` ou configure um navegador Playwright. Fixtures sintéticas estão em `tests/fixtures`; podem ser recriadas com `node scripts/fixtures.mjs`. Falhas de rede, Blob e download são injetadas apenas pelos testes; não há menus de erro fictício na aplicação publicada.

## Documentação

- [Implementação e referências](docs/IMPLEMENTACAO_FIGMA.md)
- [Mapa dos 44 estados](docs/MAPA_44_ESTADOS.md)
- [Resultados de validação](docs/VALIDACAO.md)
- [Aplicação branca da marca no fundo escuro](docs/APLICACAO_DA_MARCA.md)
- [Novo exemplo farmacêutico e arquivos](docs/EXEMPLO_FARMA.md)

Os originais .fig e ZIPs foram preservados. Materiais extraídos ficam em `materiais/`; capturas e contextos do Figma em `docs/referencias/`; capturas da aplicação em `docs/capturas/`. Esses materiais não entram no ZIP de hospedagem.

No repositório Git, esses materiais de origem e evidências geradas permanecem fora do versionamento, assim como `node_modules/`, `dist/` e os ZIPs. O código, os assets utilizados, as fixtures sintéticas, os testes e a documentação estão incluídos. Algumas auditorias visuais em `scripts/` dependem dos materiais da entrega local. Para obter a distribuição a partir de um clone, execute `npm run build`; para executar os testes, instale as dependências com `npm ci`.

Limites de importação: 50 MiB, 16 milhões de pixels, até 8.192 px por lado. SVG deve ser estático e autocontido. Saídas excessivas geram um erro recuperável; ver limites detalhados na documentação. Créditos dos integrantes continuam a preencher, conforme o conteúdo recebido.

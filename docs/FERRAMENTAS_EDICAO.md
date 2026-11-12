# Importar, Escreva e Ajustar

Implementação de 12/11/2026, solicitada após a troca de Fundos por Filtros. Os três atalhos ocupam a primeira linha de Ferramentas. Fundo, Aparência, Escala, Comparar, Redução e Original continuam disponíveis. A identidade Craft Brand branca sobre fundo escuro não foi alterada.

## Interações

- **IMPORTAR** aceita PNG, JPG/JPEG e SVG estático, até 50 MiB e dentro dos limites de dimensão já usados pelo editor. A imagem entra acima do logotipo. Cada camada tem posição horizontal/vertical, largura e opacidade. Seletor de camadas, adição e remoção permitem continuar uma edição aplicada. Validação e cancelamento preservam o documento aberto; cancelar o seletor nativo não cria uma camada.
- **ESCREVA** cria uma caixa de texto editável, com quebras de linha e ajuste automático de linha à largura da caixa. Há três fontes locais, cor, tamanho e alinhamento. O limite de 280 caracteres aparece no painel. Camadas podem ser arrastadas na prévia ou movidas pelas setas; Shift + seta move cinco pontos percentuais. Os controles de posição são a alternativa ao arraste.
- **AJUSTAR** permite escolher a imagem de destino: logo ou uma imagem sobreposta. Um seletor por grupo mantém os dez controles alcançáveis sem uma lista longa de sliders. Os valores variam de −100 a +100 e zero é neutro. Texto é editado por Estilo; ajustes fotográficos atuam nas imagens.

As novas camadas ficam acima das anteriores. O documento aceita oito camadas; não há reordenação, rotação ou salvamento de projeto nesta versão. Aplicar confirma uma transação única. Cancelar/Fechar/Escape descartam o rascunho. Desfazer/Refazer e Restaurar ajustes incluem as camadas, fontes, posições e correções de imagem. Recarregar encerra a sessão, como antes.

## Correções de imagem

| Controle | Efeito |
|---|---|
| Brilho | Desloca os níveis RGB de modo uniforme |
| Contraste | Expande ou comprime os níveis em torno do cinza médio |
| Tom | Curva de gama nos meios-tons, com extremos preservados quando usado isoladamente |
| Ponto branco | Realça ou reduz a intensidade perto do branco |
| Ponto preto | Aprofunda ou levanta os tons próximos do preto |
| Altas luzes | Correção ponderada para áreas claras |
| Sombras | Correção ponderada para áreas escuras |
| Saturação | Afasta ou aproxima os canais da luminância; −100 resulta em cinza |
| Calor | Balanço azul/âmbar |
| Tonalidade | Balanço verde/magenta |

As correções não alteram o canal alfa. São controles criativos de pixels RGB, sem alegação de recuperação de informação já perdida no arquivo. O filtro criativo ou a aparência é calculado antes das correções do logo; sobreposições mantêm suas cores, com correções independentes.

## Renderização, recursos e exportação

Prévia e PNG usam o mesmo desenho de composição. O logotipo mantém escala, proporção e margens. As camadas usam coordenadas percentuais no quadro quadrado e são recortadas na borda desse quadro. Tamanho do texto e largura de camada são percentuais do quadro. O PNG de prévia mede 1080 × 1080 e não inclui seleção ou quadriculado.

Com camadas, as provas de redução medem 256 × 256, 128 × 128, 64 × 64 e 32 × 32, incluindo toda a composição. Sem camadas, mantêm a proporção original e as larguras anteriores. Comparações de versões e filtros alteram o logo; a tipografia e as imagens adicionadas são mantidas.

Histórico e rascunhos são cópias profundas do estado. Arquivos decodificados ficam separados, referenciados por ID. Os recursos permanecem enquanto forem necessários ao documento, rascunho ou histórico e são liberados quando a última referência desaparece ou o documento é substituído. O cache de correções guarda apenas a última combinação por imagem, evitando criar um canvas para cada movimento do slider.

Fontes distribuídas: Manrope (licença já incluída), Lora e Space Mono, obtidas dos diretórios oficiais [Lora](https://github.com/google/fonts/tree/main/ofl/lora) e [Space Mono](https://github.com/google/fonts/tree/main/ofl/spacemono) de Google Fonts. Arquivos originais e licenças SIL OFL ficam em `public/fonts/`. Não há requisições a serviços de fontes durante o uso. A exportação aguarda o carregamento das fontes utilizadas.

## Evidências

`tests/editing.spec.js` cobre sobreposição e JPG real, validação recuperável, cancelamento, descarte de recursos, histórico, fontes distintas, texto multilinha, arraste, teclado, todos os dez ajustes com alfa preservado, destinos independentes, pixels do PNG e redução com camadas. Verifica os novos painéis em quatro tamanhos de tela e texto ampliado a 200% em 360 × 640 e 360 × 560. Não substitui testes em aparelhos físicos.

`scripts/render-editing.mjs` reproduz as capturas abaixo e exporta um PNG real com logo, imagem sobreposta e texto:

- [Ferramentas](ferramentas/ferramentas.png)
- [Importar](ferramentas/importar.png)
- [Escreva](ferramentas/escreva.png)
- [Ajustar](ferramentas/ajustar.png)
- [Composição exportada](ferramentas/composicao.png)

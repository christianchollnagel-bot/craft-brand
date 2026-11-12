import { FILE_SIZE_MB } from './limits.js';

export const ERRORS = {
  format: ['Formato incompatível', 'Este formato não é compatível', 'Abra um logotipo em PNG ou SVG. Outros formatos não podem ser testados aqui.'],
  size: ['Arquivo acima do limite', `O arquivo ultrapassa ${FILE_SIZE_MB} MB`, 'Reduza o tamanho do arquivo e tente novamente. Você também pode escolher outro PNG ou SVG.'],
  corrupt: ['Arquivo corrompido', 'Não conseguimos ler o arquivo', 'Ele pode estar incompleto ou corrompido. Exporte uma nova cópia e tente novamente. Seu logotipo atual continua aberto.'],
  external: ['Recursos indisponíveis', 'Este SVG depende de outros arquivos', 'Algumas imagens, fontes ou referências externas não puderam ser carregadas. Exporte o SVG com os recursos incorporados.'],
  dimensions: ['Imagem grande demais', 'A imagem é grande demais para processar', 'Reduza as dimensões da imagem e tente novamente. O logotipo atual e seus ajustes foram preservados.'],
  empty: ['Sem conteúdo visível', 'Não encontramos conteúdo visível', 'Confira se o arquivo contém elementos visíveis e exporte uma nova cópia. O arquivo atual continua aberto.'],
  example: ['Falha ao abrir exemplo', 'O exemplo não carregou', 'Tente novamente ou abra um logotipo do seu aparelho para começar.'],
  export: ['Falha na exportação', 'Não foi possível preparar a imagem', 'Seu logotipo e os ajustes continuam aqui. Tente gerar o PNG novamente.']
};

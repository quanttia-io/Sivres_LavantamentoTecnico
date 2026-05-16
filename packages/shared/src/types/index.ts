export type Role = 'SUPERVISOR' | 'CONSULTOR' | 'GESTOR' | 'ADMINISTRADOR';

export type TipoPortaria = 'ASSISTIDA' | 'AUTONOMA' | 'CONTROLE_ACESSO';

export type VistoriaStatus =
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'REPROVADO';

export type FotoCategoria =
  | 'FRENTE_CONDOMINIO'
  | 'PORTAO_VEICULAR_FRENTE'
  | 'PORTAO_VEICULAR_COSTAS'
  | 'PORTAO_PEDESTRE_FRENTE'
  | 'PORTAO_PEDESTRE_COSTAS'
  | 'ELEVADORES'
  | 'HALL'
  | 'GUARITA'
  | 'LIXEIRA'
  | 'VISTA_SUPERIOR_MAPS'
  | 'OUTROS';

export type AnexoTipo = 'CROQUI' | 'PROJETO_TECNICO' | 'OUTRO';
export type AssinaturaTipo = 'SUPERVISOR' | 'CONSULTOR';
export type AprovacaoAcao = 'APROVADO' | 'REPROVADO' | 'SOLICITADO_AJUSTE';

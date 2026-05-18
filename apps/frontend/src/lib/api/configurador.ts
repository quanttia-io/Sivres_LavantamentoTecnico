import { api } from './client';

export interface ConfiguracaoEntradas {
  tipoPortaria: string;
  qtdUnidades: number;
  tipoCondominioVertical?: boolean;

  // ─── PORTÕES PEDESTRE ────────────────────────────────────────────────────
  pedPivManual?: number;       // Pivotante Manual
  pedPivAuto?: number;         // Pivotante Auto (Giro)
  pedDeslPiso?: number;        // Deslizante Auto (motor piso)
  pedDeslTeto?: number;        // Deslizante Auto (motor teto)
  pedPivVidro?: number;        // Pivotante de Vidro (s/ mola)
  pedOutro?: number;           // Outro tipo

  // ─── CONTROLE PEDESTRE ───────────────────────────────────────────────────
  eclusaPedestre?: number;     // Qtd Eclusas de Pedestre
  leitorTagPedestre?: number;  // Qtd Leitores TAG
  biometriaDigital?: number;   // Qtd Leitores Biométrico Digital
  biometriaFacial?: number;    // Qtd Leitores Biométrico Facial
  opcaoSaidaPedestres?: number; // 0=Interfone, 1=Botão

  // ─── CÂMERAS E INTERFONES ────────────────────────────────────────────────
  interfoneAut?: number;       // Qtd Interfones para Autônoma
  camerasPortariaAut?: number; // Qtd Câmeras Portaria (Autônoma)
  interfoneRem?: number;       // Qtd Interfones para Atend. CCC
  camerasPortariaRem?: number; // Qtd Câmeras Portaria (CCC/Remota)
  integracaoInterfone?: boolean; // Integração Central de Interfone

  // ─── ELEVADORES ──────────────────────────────────────────────────────────
  elevadoresMonitorados?: number; // Qtd Elevadores Monitorados (= câmeras elev)

  // ─── ACESSO VEÍCULOS — PORTÕES ───────────────────────────────────────────
  deslP?: number;              // Deslizante P
  deslM?: number;              // Deslizante M
  deslG?: number;              // Deslizante G
  bascSimples?: number;        // Basculante Simples
  pivSimples?: number;         // Pivotante Simples
  pivDuplo?: number;           // Pivotante Duplo
  veiOutro?: number;           // Outro veículo

  // ─── ACESSO VEÍCULOS — MOTORES ───────────────────────────────────────────
  motorDeslP?: number;         // Motor DZ 800 (Deslizante P)
  motorDeslM?: number;         // Motor DZ 1500 (Deslizante M)
  motorDeslG?: number;         // Motor DZ 2500 (Deslizante G)
  motorBasc?: number;          // Motor Basculante Simples
  motorPivSimples?: number;    // Motor Pivotante Simples
  motorPivDuplo?: number;      // Motor Pivotante Duplo
  motorOutro?: number;         // Motor Outro

  // ─── ACESSO VEÍCULOS — CONTROLE ──────────────────────────────────────────
  controleRemoto?: boolean;    // Abertura por Controle Remoto
  antenasTagVeicular?: number; // Qtd Antenas TAG Veicular
  biometriaFacialVeiculo?: number; // Qtd Leitor Facial Veículo
  eclusaVeiculo?: number;      // Qtd Eclusas de Veículos
  intertravamentoPedestre?: number; // Qtd Intertravamento c/ pedestre
  refletores?: number;         // Qtd Refletores

  // ─── PROTEÇÃO PERÍMETRO ──────────────────────────────────────────────────
  metrosCerca?: number;        // Metros de Cerca Elétrica
  sensoresBarreira?: number;   // Qtd Sensores de Barreira (pares)
  cercaEletrica?: number;      // 0=Nenhuma, 1=Completa, 2=Apenas fiação

  // ─── DISPOSITIVOS ────────────────────────────────────────────────────────
  tagPedestre?: number;        // Qtd Tag Pedestre (cartão+chaveiro total)
  pulseiraPedestre?: number;   // Qtd Pulseira Pedestre
  controleVeiculos?: number;   // Qtd Controles de Veículos
  tagVeicularComum?: number;   // Qtd Tag Veicular Comum
  tagVeicularBlindada?: number; // Qtd Tag Veicular Blindada

  // ─── LIXEIRA ─────────────────────────────────────────────────────────────
  lixeiraModalidade?: number;  // 0=Nenhum, 1=Interfone, 2=Botão
  lixeiraPivManual?: number;   // Portão Pivotante Manual lixeira
  lixeiraDeslPiso?: number;    // Portão Deslizante Auto lixeira

  // ─── HALL DE PEDESTRES ───────────────────────────────────────────────────
  hallAberturaTemporizador?: boolean; // Abertura automática com temporizador
  hallPivManual?: number;      // Pivotante Manual hall
  hallPivAuto?: number;        // Pivotante Auto hall
  hallDeslPiso?: number;       // Deslizante Auto piso hall
  hallDeslTeto?: number;       // Deslizante Auto teto hall
  hallPivVidro?: number;       // Pivotante de Vidro hall

  // ─── OUTROS ──────────────────────────────────────────────────────────────
  celularZelador?: boolean;    // Celular com linha para Zelador
}

export interface ItemCalculado {
  produtoId: string;
  codigo: string;
  descricao: string;
  classeEquipamento: string | null;
  custoUnit: number;
  quantidade: number;
  custoTotal: number;
}

export const configuradorApi = {
  calcular: (entradas: ConfiguracaoEntradas) =>
    api.post('/configurador/calcular', entradas) as Promise<ItemCalculado[]>,

  aplicar: (vistoriaId: string, entradas: ConfiguracaoEntradas) =>
    api.post(`/configurador/aplicar/${vistoriaId}`, entradas) as Promise<ItemCalculado[]>,
};

export const precificacaoApi = {
  calcular: (vistoriaId: string, opcoes: {
    tipoContrato?: string;
    internetPagoPor?: string;
    celularZelador?: boolean;
    margemTipo?: string;
  }) => api.post(`/precificacao/${vistoriaId}/calcular`, opcoes),

  obterResumo: (vistoriaId: string) =>
    api.get(`/precificacao/${vistoriaId}`),
};

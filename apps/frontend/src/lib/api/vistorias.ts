import { api } from './client';

export interface VistoriaFiltros {
  search?: string;
  status?: string;
  tipoPortaria?: string;
  page?: number;
  limit?: number;
}

export const vistoriasApi = {
  listar: (filtros?: VistoriaFiltros) => api.get('/vistorias', { params: filtros }),
  buscar: (id: string) => api.get(`/vistorias/${id}`),
  criar: (data: unknown) => api.post('/vistorias', data),
  atualizar: (id: string, data: unknown) => api.patch(`/vistorias/${id}`, data),
  finalizar: (id: string) => api.post(`/vistorias/${id}/finalizar`),
  excluir: (id: string) => api.delete(`/vistorias/${id}`),
  adquirirLock: (id: string) => api.post(`/vistorias/${id}/lock`),
  liberarLock: (id: string) => api.delete(`/vistorias/${id}/lock`),
  gerarPdf: (id: string) =>
    api.get(`/vistorias/${id}/pdf`, { responseType: 'blob' }),

  // Checklist
  checklist: (id: string) => api.get(`/vistorias/${id}/checklist`),
  responderChecklist: (id: string, data: unknown) =>
    api.post(`/vistorias/${id}/checklist/responder`, data),
  responderChecklistLote: (id: string, data: unknown[]) =>
    api.put(`/vistorias/${id}/checklist/lote`, data),

  // Fotos
  listarFotos: (id: string) => api.get(`/vistorias/${id}/fotos`),
  uploadFoto: (id: string, formData: FormData) =>
    api.post(`/vistorias/${id}/fotos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removerFoto: (vistoriaId: string, fotoId: string) =>
    api.delete(`/vistorias/${vistoriaId}/fotos/${fotoId}`),

  // Anexos
  listarAnexos: (id: string) => api.get(`/vistorias/${id}/anexos`),
  uploadAnexo: (id: string, formData: FormData) =>
    api.post(`/vistorias/${id}/anexos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removerAnexo: (vistoriaId: string, anexoId: string) =>
    api.delete(`/vistorias/${vistoriaId}/anexos/${anexoId}`),

  // Assinaturas
  listarAssinaturas: (id: string) => api.get(`/vistorias/${id}/assinaturas`),
  salvarAssinatura: (id: string, data: { tipo: string; base64Png: string }) =>
    api.post(`/vistorias/${id}/assinaturas`, data),

  // Aprovação
  aprovar: (id: string, data: { acao: string; comentario: string }) =>
    api.post(`/vistorias/${id}/aprovacao`, data),
  historicoAprovacao: (id: string) => api.get(`/vistorias/${id}/aprovacao/historico`),
};

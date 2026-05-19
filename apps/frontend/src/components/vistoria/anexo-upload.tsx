'use client';

import { useRef, useState } from 'react';
import { FileText, FileImage, File, Trash2, Upload, Download } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export const ANEXO_TIPOS = [
  { value: 'CROQUI', label: 'Croqui' },
  { value: 'PROJETO_TECNICO', label: 'Projeto Técnico' },
  { value: 'OUTRO', label: 'Outro' },
];

const TIPO_COLORS: Record<string, string> = {
  CROQUI: 'bg-purple-100 text-purple-700',
  PROJETO_TECNICO: 'bg-blue-100 text-blue-700',
  OUTRO: 'bg-gray-100 text-gray-600',
};

interface AnexoItem {
  id: string;
  tipo: string;
  nome: string;
  url: string;
  mimeType: string;
  createdAt: string;
}

interface AnexoUploadProps {
  anexos: AnexoItem[];
  onUpload: (file: File, tipo: string, nome?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  disabled?: boolean;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') return <FileText size={20} className="text-red-500" />;
  if (mimeType.startsWith('image/')) return <FileImage size={20} className="text-blue-500" />;
  return <File size={20} className="text-gray-400" />;
}

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function AnexoUpload({ anexos, onUpload, onRemove, disabled = false }: AnexoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState('CROQUI');
  const [nome, setNome] = useState('');

  const handleFile = async (file: File) => {
    const maxMb = 20;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxMb}MB.`);
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Formato não suportado. Use PDF, JPG ou PNG.');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file, selectedTipo, nome.trim() || undefined);
      setNome('');
      toast.success('Anexo adicionado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao enviar anexo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await onRemove(id);
      toast.success('Anexo removido');
    } catch {
      toast.error('Erro ao remover anexo');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário de upload */}
      {!disabled && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">
            Adicionar Documento ({anexos.length} anexo{anexos.length !== 1 ? 's' : ''})
          </h3>

          <div>
            <label className="label">Tipo de Documento</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="input"
            >
              {ANEXO_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nome (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Croqui Bloco A..."
              className="input"
            />
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-primary w-full"
          >
            <Upload size={18} />
            {uploading ? 'Enviando...' : 'Selecionar arquivo (PDF, JPG, PNG)'}
          </button>
        </div>
      )}

      {/* Lista de anexos */}
      {anexos.length > 0 ? (
        <div className="space-y-2">
          {anexos.map((anexo) => (
            <div key={anexo.id} className="card flex items-center gap-3">
              <div className="shrink-0">
                <FileIcon mimeType={anexo.mimeType} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{anexo.nome}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded', TIPO_COLORS[anexo.tipo])}>
                    {ANEXO_TIPOS.find((t) => t.value === anexo.tipo)?.label ?? anexo.tipo}
                  </span>
                  <span className="text-[10px] text-gray-400">{formatDate(anexo.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Abrir"
                >
                  <Download size={16} />
                </a>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(anexo.id)}
                    disabled={removingId === anexo.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum anexo adicionado</p>
          <p className="text-xs mt-1">Croquis, projetos técnicos e outros documentos</p>
        </div>
      )}
    </div>
  );
}

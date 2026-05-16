'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { Camera, Trash2, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export const FOTO_CATEGORIAS = [
  { value: 'FRENTE_CONDOMINIO', label: 'Frente do Condomínio' },
  { value: 'PORTAO_VEICULAR_FRENTE', label: 'Portão Veicular Frente' },
  { value: 'PORTAO_VEICULAR_COSTAS', label: 'Portão Veicular Costas' },
  { value: 'PORTAO_PEDESTRE_FRENTE', label: 'Portão Pedestre Frente' },
  { value: 'PORTAO_PEDESTRE_COSTAS', label: 'Portão Pedestre Costas' },
  { value: 'ELEVADORES', label: 'Elevadores' },
  { value: 'HALL', label: 'Hall' },
  { value: 'GUARITA', label: 'Guarita' },
  { value: 'LIXEIRA', label: 'Lixeira' },
  { value: 'VISTA_SUPERIOR_MAPS', label: 'Vista Superior (Maps)' },
  { value: 'OUTROS', label: 'Outros' },
];

interface FotoItem {
  id: string;
  url: string;
  categoria: string;
  descricao?: string;
}

interface FotoUploadProps {
  fotos: FotoItem[];
  onUpload: (file: File, categoria: string, descricao?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  maxFotos?: number;
}

export default function FotoUpload({ fotos, onUpload, onRemove, maxFotos = 10 }: FotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState('FRENTE_CONDOMINIO');
  const [descricao, setDescricao] = useState('');

  const handleFile = async (file: File) => {
    if (fotos.length >= maxFotos) {
      toast.error(`Máximo de ${maxFotos} fotos por vistoria`);
      return;
    }

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      await onUpload(compressed as File, selectedCategoria, descricao || undefined);
      setDescricao('');
      toast.success('Foto adicionada');
    } catch (err) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          Adicionar Foto ({fotos.length}/{maxFotos})
        </h3>

        <div>
          <label className="label">Categoria</label>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="input"
          >
            {FOTO_CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {selectedCategoria === 'OUTROS' && (
          <div>
            <label className="label">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a foto..."
              className="input"
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute('capture');
                inputRef.current.click();
              }
            }}
            disabled={uploading || fotos.length >= maxFotos}
            className="btn-secondary flex-1"
          >
            <Upload size={18} />
            Galeria
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || fotos.length >= maxFotos}
            className="btn-primary flex-1"
          >
            <Camera size={18} />
            {uploading ? 'Enviando...' : 'Câmera'}
          </button>
        </div>
      </div>

      {/* Grid de fotos */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
              <Image src={foto.url} alt={foto.categoria} fill className="object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">
                  {FOTO_CATEGORIAS.find((c) => c.value === foto.categoria)?.label ?? foto.categoria}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(foto.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center min-h-0"
              >
                <Trash2 size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {fotos.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Camera size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma foto adicionada</p>
        </div>
      )}
    </div>
  );
}

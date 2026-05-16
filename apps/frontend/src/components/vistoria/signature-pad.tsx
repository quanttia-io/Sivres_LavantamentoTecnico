'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSave: (base64Png: string) => void;
  savedUrl?: string;
}

export default function SignaturePad({ label, onSave, savedUrl }: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    if (canvasRef.current?.isEmpty()) return;
    const data = canvasRef.current!.toDataURL('image/png');
    onSave(data);
  };

  if (savedUrl) {
    return (
      <div className="card">
        <p className="label mb-2">{label} — Assinado</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={savedUrl} alt={label} className="w-full h-24 object-contain border border-gray-200 rounded-xl" />
        <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
          <Check size={14} />
          Assinatura registrada
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="label mb-2">{label}</p>
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            className: 'w-full touch-none',
            style: { height: 140, width: '100%' },
          }}
          backgroundColor="white"
          penColor="#1a365d"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">Assine dentro do campo acima</p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => canvasRef.current?.clear()}
          className="btn-secondary flex-1"
        >
          <RotateCcw size={16} />
          Limpar
        </button>
        <button type="button" onClick={handleSave} className="btn-primary flex-1">
          <Check size={16} />
          Confirmar
        </button>
      </div>
    </div>
  );
}

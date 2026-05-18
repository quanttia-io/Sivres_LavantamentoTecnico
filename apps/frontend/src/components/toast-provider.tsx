'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
      }}
    />
  );
}

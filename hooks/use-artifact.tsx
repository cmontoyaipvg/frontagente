
'use client';

import { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';
import { UIArtifact, ArtifactKind } from '@/types/playground';

// Estado inicial del artefacto
export const initialArtifactData: UIArtifact = {
  title: '',
  documentId: 'init',
  kind: 'text',
  content: '',
  isVisible: false,
  status: 'idle',
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0
  }
};

// Interfaz para el contexto del artefacto
interface ArtifactContextType {
  artifact: UIArtifact;
  setArtifact: Dispatch<SetStateAction<UIArtifact>>;
  metadata: any;
  setMetadata: Dispatch<SetStateAction<any>>;
}

// Creación del contexto
const ArtifactContext = createContext<ArtifactContextType>({
  artifact: initialArtifactData,
  setArtifact: () => {},
  metadata: {},
  setMetadata: () => {}
});

// Proveedor del contexto de artefactos
export const ArtifactProvider = ({ children }: { children: React.ReactNode }) => {
  const [artifact, setArtifact] = useState<UIArtifact>(initialArtifactData);
  const [metadata, setMetadata] = useState<any>({});

  return (
    <ArtifactContext.Provider value={{ artifact, setArtifact, metadata, setMetadata }}>
      {children}
    </ArtifactContext.Provider>
  );
};

// Hook personalizado para acceder al contexto
export const useArtifact = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error('useArtifact debe usarse dentro de un ArtifactProvider');
  }
  return context;
};
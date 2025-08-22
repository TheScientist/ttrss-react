import { createContext, useState, useContext, type ReactNode, useCallback, useMemo } from 'react';

export interface Selection {
  id: number;
  isCategory: boolean;
}

interface SelectionContextType {
  selection: Selection | null;
  setSelection: (selection: Selection | null) => void;
  selectedArticleId: number | null;
  setSelectedArticleId: (id: number | null) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
    const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  const handleSetSelection = useCallback((newSelection: Selection | null) => {
    setSelection(newSelection);
    // Reset article selection when feed/category changes
    setSelectedArticleId(null);
  }, []);

  const value = useMemo(() => ({
    selection,
    setSelection: handleSetSelection,
    selectedArticleId,
    setSelectedArticleId,
  }), [selection, selectedArticleId, handleSetSelection]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = (): SelectionContextType => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};

import { createContext, useState, useContext, type ReactNode, useCallback, useMemo, useEffect } from 'react';

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
  const [selection, setSelection] = useState<Selection | null>(() => {
    try {
      const item = window.localStorage.getItem('selectedFeed');
      if (item) {
        const parsed = JSON.parse(item);
        if (typeof parsed === 'object' && parsed !== null && 'id' in parsed && 'isCategory' in parsed) {
          return parsed as Selection;
        }
      }
      return null;
    } catch (error) {
      console.log('Error reading selectedFeed from localStorage', error);
      return null;
    }
  });
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (selection) {
        window.localStorage.setItem('selectedFeed', JSON.stringify(selection));
      } else {
        window.localStorage.removeItem('selectedFeed');
      }
    } catch (error) {
      console.log('Error saving selectedFeed to localStorage', error);
    }
  }, [selection]);

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

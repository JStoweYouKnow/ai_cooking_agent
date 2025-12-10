import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import GlobalSearchOverlay from "../screens/Search/GlobalSearchOverlay";

type SearchContextValue = {
  openSearch: () => void;
  closeSearch: () => void;
};

const SearchContext = createContext<SearchContextValue>({
  openSearch: () => {},
  closeSearch: () => {},
});

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);

  const openSearch = useCallback(() => setVisible(true), []);
  const closeSearch = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape") {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch, closeSearch]);

  return (
    <SearchContext.Provider value={{ openSearch, closeSearch }}>
      {children}
      <GlobalSearchOverlay visible={visible} onClose={closeSearch} />
    </SearchContext.Provider>
  );
};

export const useGlobalSearch = () => useContext(SearchContext);


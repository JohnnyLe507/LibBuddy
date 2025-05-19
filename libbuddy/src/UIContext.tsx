import React, { createContext, useContext, useState } from "react";

interface UIContextType {
  isLoginVisible: boolean;
  setIsLoginVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  return (
    <UIContext.Provider value={{ isLoginVisible, setIsLoginVisible }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
};

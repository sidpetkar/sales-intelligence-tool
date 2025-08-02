'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface MockDataContextType {
  useMockData: boolean;
  setUseMockData: (useMockData: boolean) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider = ({ children }: { children: ReactNode }) => {
  const [useMockData, setUseMockData] = useState(false);

  return (
    <MockDataContext.Provider value={{ useMockData, setUseMockData }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}; 
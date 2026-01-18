/**
 * Test Utilities
 * 
 * Common utilities for testing React components
 */

import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Wrapper with all providers
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

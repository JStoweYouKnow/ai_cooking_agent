"use client";
import { ProfessionalLayout, ModalProvider } from './professional-ui-kit';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <ProfessionalLayout>
        {children}
      </ProfessionalLayout>
    </ModalProvider>
  );
}


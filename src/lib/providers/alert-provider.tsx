"use client";

import React, { createContext, useContext, useState, useRef } from "react";

interface AlertContextProps {
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isConfirm: false,
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showAlert = (message: string, title: string = "Notification") => {
    setModalState({
      isOpen: true,
      title,
      message,
      isConfirm: false,
    });
  };

  const showConfirm = (message: string, title: string = "Confirm Action"): Promise<boolean> => {
    setModalState({
      isOpen: true,
      title,
      message,
      isConfirm: true,
    });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleClose = (result: boolean) => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-zinc-900/85 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{modalState.title}</h3>
              <p className="text-sm text-muted/90 mt-2 leading-relaxed">{modalState.message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {modalState.isConfirm && (
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

import { Drawer } from "vaul";
import React, { useState } from "react";
import { X } from "lucide-react";

interface IPODrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

export function IPODrawer({ open, onOpenChange, children, title }: IPODrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[10px] h-[90vh] sm:h-[96vh] fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 outline-none">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-slate-700 mb-6" />
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <Drawer.Title className="font-bold text-2xl text-gray-900 dark:text-white">
                  {title || "IPO Details"}
                </Drawer.Title>
                <button
                    onClick={() => onOpenChange(false)}
                    className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

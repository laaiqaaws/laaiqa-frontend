"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast bg-[#1a1a1a] border-gray-700 shadow-xl rounded-lg p-4 w-full max-w-[calc(100vw-2rem)] mx-auto",
          title: "text-white font-semibold text-base",
          description: "text-gray-300 text-sm",
          actionButton: "bg-[#C40F5A] text-white hover:bg-[#EE2377] !rounded-md px-4 py-2",
          cancelButton: "bg-gray-700 text-white hover:bg-gray-600 !rounded-md px-4 py-2",
          closeButton: "bg-transparent border-0 text-gray-400 hover:text-white hover:bg-gray-700 !rounded-md !right-2 !top-2 !left-auto",
        },
        duration: 6000,
      }}
      closeButton
      richColors
      expand
      visibleToasts={3}
      style={
        {
          "--normal-bg": "#1a1a1a",
          "--normal-text": "#ffffff",
          "--normal-border": "#374151",
          "--success-bg": "#1a1a1a",
          "--success-text": "#22c55e",
          "--success-border": "#22c55e",
          "--error-bg": "#1a1a1a",
          "--error-text": "#ef4444",
          "--error-border": "#ef4444",
          "--info-bg": "#1a1a1a",
          "--info-text": "#3b82f6",
          "--info-border": "#3b82f6",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

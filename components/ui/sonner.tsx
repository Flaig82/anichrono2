"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a1a1e] group-[.toaster]:text-white group-[.toaster]:border-[rgba(255,255,255,0.07)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#8A94A8]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

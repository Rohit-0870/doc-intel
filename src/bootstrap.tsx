import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"

let root: ReactDOM.Root | null = null

export function mount(container: HTMLElement, props?: any) {
  root = ReactDOM.createRoot(container)
  root.render(<App {...props} />)
}

export function unmount() {
  if (root) {
    root.unmount()
    root = null
  }
}

// Auto mount when running standalone (local dev)
if (import.meta.env.DEV) {
  const el = document.getElementById("root")
  if (el) mount(el)
}
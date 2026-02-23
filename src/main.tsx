import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css"
export * from "./bootstrap"

createRoot(document.getElementById("root")!).render(<App />);

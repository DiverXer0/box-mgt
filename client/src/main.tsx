import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/contexts/theme-context";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="box-management-theme">
    <App />
  </ThemeProvider>
);

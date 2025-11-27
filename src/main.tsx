import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(<App />);

const removeInitialLoader = () => {
  const loader = document.getElementById("initial-loader");
  if (!loader) return;
  setTimeout(() => loader.remove(), 2200);
};

if (document.readyState === "complete") {
  removeInitialLoader();
} else {
  window.addEventListener("load", removeInitialLoader);
}

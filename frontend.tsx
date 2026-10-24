import { createRoot } from "react-dom/client";
import { App } from "./src/App";
import "./src/styles.css";

export { App };

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(<App />);
}

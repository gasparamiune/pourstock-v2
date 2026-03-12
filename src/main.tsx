import { createRoot } from "react-dom/client";
import "./index.css";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
};

const ensureSafeLocalStorage = () => {
  if (typeof window === "undefined") return;

  try {
    const probe = "__pourstock_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch {
    const fallbackStorage = createMemoryStorage();

    try {
      Object.defineProperty(window, "localStorage", {
        value: fallbackStorage,
        configurable: true,
      });
    } catch {
      Reflect.set(globalThis as Record<string, unknown>, "localStorage", fallbackStorage);
    }
  }
};

const bootstrap = async () => {
  ensureSafeLocalStorage();
  const { default: App } = await import("./App.tsx");

  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<App />);
  }
};

void bootstrap();

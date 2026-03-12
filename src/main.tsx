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

const renderFatalError = (error: unknown) => {
  const root = document.getElementById("root");
  if (!root) return;

  const message = error instanceof Error ? error.message : "Unknown startup error";

  createRoot(root).render(
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="mx-auto max-w-3xl rounded-xl border border-destructive/40 bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-destructive">PourStock failed to start</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The app could not initialize due to a configuration issue.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs md:text-sm">{message}</pre>
        <p className="mt-4 text-sm text-muted-foreground">
          If this happens only on the published site, open Lovable → Project Settings → Environment Variables,
          add the missing variables for Production, then publish again.
        </p>
      </div>
    </div>
  );
};

const bootstrap = async () => {
  ensureSafeLocalStorage();

  try {
    const { default: App } = await import("./App.tsx");

    const root = document.getElementById("root");
    if (root) {
      createRoot(root).render(<App />);
    }
  } catch (error) {
    renderFatalError(error);

    if (import.meta.env.DEV) {
      console.error("Application bootstrap failed", error);
    }
  }
};

void bootstrap();

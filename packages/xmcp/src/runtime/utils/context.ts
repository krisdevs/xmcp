import { AsyncLocalStorage } from "async_hooks";

type DefaultContext = Object;

type GetContext<T extends DefaultContext> = () => T;

type SetContext<T extends DefaultContext> = (data: Partial<T>) => void;

export interface Context<T extends DefaultContext> {
  provider: (initialValue: T, callback: () => void) => void;
  getContext: GetContext<T>;
  setContext: SetContext<T>;
}

interface CreateContextOptions {
  name: string;
}

export function createContext<T extends Object>({
  name,
}: CreateContextOptions) {
  const storageKey = crypto.randomUUID();

  if ((globalThis as any)[storageKey]) {
    throw new Error("Context already created");
  }

  (globalThis as any)[storageKey] = new AsyncLocalStorage<T>();

  const context = (globalThis as any)[storageKey] as AsyncLocalStorage<T>;

  const getContext: GetContext<T> = () => {
    const store = context.getStore();

    if (!store) {
      throw new Error(
        `getContext() can only be used within the ${name} context.`
      );
    }

    return store;
  };

  const setContext: SetContext<T> = (data) => {
    const store = context.getStore();

    if (!store) {
      throw new Error(
        `setContext() can only be used within the ${name} context.`
      );
    }

    Object.assign(store, data);
  };

  const provider = (initialValue: T, callback: () => void) => {
    return context.run(initialValue, callback);
  };

  const result: Context<T> = {
    provider,
    getContext,
    setContext,
  };

  return result;
}

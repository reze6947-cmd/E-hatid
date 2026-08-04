type RefreshHandler = () => void | Promise<void>;

let currentHandler: RefreshHandler | null = null;

export const registerRefreshHandler = (handler: RefreshHandler | null) => {
  currentHandler = handler;
};

export const runRefreshHandler = async () => {
  try {
    await currentHandler?.();
  } catch {
    // ignore refresh errors
  }
};

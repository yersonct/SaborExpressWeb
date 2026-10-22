/** Runs mount synchronization after the effect phase and cancels it on unmount. */
export function deferEffect(callback: () => void): () => void {
  let active = true;
  queueMicrotask(() => {
    if (active) callback();
  });
  return () => {
    active = false;
  };
}

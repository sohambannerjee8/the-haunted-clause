// A dynamic-import loader that caches success but forgets failure, so "Try again" really
// imports again (haunted-house-ui R17.3).
export function createRetryableImport<T>(loader: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = loader().catch((e: unknown) => {
        pending = null;
        throw e;
      });
    }
    return pending;
  };
}

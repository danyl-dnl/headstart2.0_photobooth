/** Prevent overlapping attempts from the same booth flow while allowing a retry after completion. */
export function createDeliveryAttemptGuard() {
  let inFlight = false;

  return {
    get inFlight() {
      return inFlight;
    },
    async run<Result>(operation: () => Promise<Result>): Promise<Result | null> {
      if (inFlight) return null;
      inFlight = true;
      try {
        return await operation();
      } finally {
        inFlight = false;
      }
    },
  };
}

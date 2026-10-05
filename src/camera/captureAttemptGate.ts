/** Synchronous single-flight guard for fast repeated taps on the capture control. */
export function createCaptureAttemptGate() {
  let active = false;
  return {
    acquire(): boolean {
      if (active) return false;
      active = true;
      return true;
    },
    release(): void { active = false; },
    get isActive(): boolean { return active; },
  };
}

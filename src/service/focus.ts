export class FocusListener {
  private callbacks: Record<'focusLoss' | 'focusGain', (() => void)>

  constructor({ focusLoss, focusGain }: { focusLoss: () => void, focusGain: () => void }) {
    this.callbacks = { focusLoss, focusGain }
    this.setupListeners();
  }

  private setupListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleFocusLoss();
      } else {
        this.handleFocusGain();
      }
    });

    // Handle window focus/blur (additional safety)
    window.addEventListener('blur', this.handleFocusLoss);
    window.addEventListener('focus', this.handleFocusGain);

    // Handle page hide/show (for mobile browsers)
    window.addEventListener('pagehide', this.handleFocusLoss);
    window.addEventListener('pageshow', this.handleFocusGain);
  }

  private handleFocusLoss = () => {
    this.callbacks.focusLoss()
  }

  private handleFocusGain = () => {
    this.callbacks.focusGain()
  }

  public dispose() {
    document.removeEventListener('visibilitychange', this.handleFocusLoss);
    document.removeEventListener('visibilitychange', this.handleFocusGain);
    window.removeEventListener('blur', this.handleFocusLoss);
    window.removeEventListener('focus', this.handleFocusGain);
    window.removeEventListener('pagehide', this.handleFocusLoss);
    window.removeEventListener('pageshow', this.handleFocusGain);
  }
}

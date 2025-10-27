export class WindowFocusService {
  private callbacks: Record<'focusLoss' | 'focusGain', (() => void)[]> = { focusLoss: [], focusGain: [] }

  constructor() {
    this.setupListeners();
  }

  public registerCallback = ({ focusLoss, focusGain }: { focusLoss?: () => void, focusGain?: () => void } = {}) => {
    if (focusLoss) {
      this.callbacks.focusLoss.push(focusLoss)
    }
    if (focusGain) {
      this.callbacks.focusGain.push(focusGain)
    }
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
    this.callbacks.focusLoss.forEach(func => func())
  }

  private handleFocusGain = () => {
    this.callbacks.focusGain.forEach(func => func())
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

type Listener = () => void;

export abstract class StateClass<TSnapshot> {
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  protected emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  abstract getSnapshot(): TSnapshot;
}

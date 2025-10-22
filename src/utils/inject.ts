/* Usage:
// First setup
injector.createInstance(Service, props);

// Later, replace with different parameters
injector.setProvider(Service, injector.createProvider(Service, newProps));
// OR
injector.setProvider(Service, () => new Service(newProps));

const service = inject(Service)
 */

class Injector {
  private static instance: Injector;
  private providers = new Map<Constructor<unknown>, Provider<unknown>>();
  private instances = new Map<Constructor<unknown>, unknown>();

  constructor() { }

  public static getInstance(): Injector {
    if (!Injector.instance) {
      Injector.instance = new Injector();
    }
    return Injector.instance;
  }

  public setProvider<T>(token: Constructor<T>, provider: Provider<T>): void {
    this.providers.set(token, provider as Provider<unknown>);
  }

  public get<T>(token: Constructor<T>): T {
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }
    if (this.providers.has(token)) {
      const provider = this.providers.get(token) as Provider<T>;
      const instance = provider();
      this.instances.set(token, instance);
      return instance;
    }
    throw new Error(`No provider found for ${token.name}`);
  }

  public createInstance<T extends Constructor>(token: T, ...args: ConstructorParameters<T>): InstanceType<T> {
    const instance = new token(...args) as InstanceType<T>;
    this.setProvider(token, () => instance);
    return instance;
  }

  public createProvider<T extends Constructor>(token: T, ...args: ConstructorParameters<T>): Provider<InstanceType<T>> {
    const instance = new token(...args) as InstanceType<T>;
    return () => instance;
  }

  public createValueProvider<T>(value: T): Provider<T> {
    return () => value;
  }

  public has<T>(token: Constructor<T>): boolean {
    return this.providers.has(token) || this.instances.has(token);
  }

  public clear(): void {
    this.providers.clear();
    this.instances.clear();
  }
}

export const injector = Injector.getInstance();

type Constructor<T = object> = new (...args: any[]) => T;
type Provider<T> = () => T;

export function Injectable<T extends Constructor>(constructor: T): T {
  if (!injector.has(constructor)) {
    injector.setProvider(constructor, () => new constructor());
  }

  return constructor;
}

export function inject<T>(token: Constructor<T>): T {
  return injector.get(token);
}

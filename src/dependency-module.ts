import { getParametersNames } from "./helpers";

export enum ModuleLifeCycle {
  SINGLETON,
  TRANSIENT,
  SCOPED,
}

export type FunctionModuleResolver<T> = (...args: any[]) => Promise<T> | T;
export type ClassModuleResolver<T> = new (...args: any[]) => T;
export type ModuleResolver<T> =
  | FunctionModuleResolver<T>
  | ClassModuleResolver<T>;

export abstract class DependencyModule<T> {
  abstract resolve(...args: any[]): Promise<T> | T;
}

export abstract class StaticDependencyModule<T> extends DependencyModule<T> {
  protected readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  resolve(): T {
    return this.value;
  }
}

export class ValueDependencyModule<T> extends StaticDependencyModule<T> {}

export abstract class DynamicDependencyModule<T> extends DependencyModule<T> {
  readonly lifeCycle: ModuleLifeCycle;
  protected cache: T | undefined;
  protected isCached: boolean = false;
  readonly resolver: ModuleResolver<T>;

  constructor(resolver: ModuleResolver<T>, lifeCycle?: ModuleLifeCycle) {
    super();
    this.resolver = resolver;
    this.lifeCycle = lifeCycle ?? ModuleLifeCycle.TRANSIENT;
  }

  get isResolved(): boolean {
    return this.isCached;
  }

  get parametersNames(): string[] {
    return getParametersNames(this.resolver);
  }
}

export class FunctionDependencyModule<T> extends DynamicDependencyModule<T> {
  constructor(
    resolver: FunctionModuleResolver<T>,
    lifeCycle?: ModuleLifeCycle
  ) {
    super(resolver, lifeCycle);
  }

  async resolve(...args: any[]): Promise<T> {
    if (this.isCached) {
      return this.cache as T;
    }

    const result = await (this.resolver as FunctionModuleResolver<T>)(...args);
    if (
      this.lifeCycle === ModuleLifeCycle.SINGLETON ||
      this.lifeCycle === ModuleLifeCycle.SCOPED
    ) {
      this.cache = result;
      this.isCached = true;
    }

    return result;
  }
}

export class ClassDependencyModule<T> extends DynamicDependencyModule<T> {
  constructor(resolver: ClassModuleResolver<T>, lifeCycle?: ModuleLifeCycle) {
    super(resolver, lifeCycle);
  }

  async resolve(...args: any[]): Promise<T> {
    if (this.isCached) {
      return this.cache as T;
    }

    const instance = new (this.resolver as ClassModuleResolver<T>)(...args);
    if (
      this.lifeCycle === ModuleLifeCycle.SINGLETON ||
      this.lifeCycle === ModuleLifeCycle.SCOPED
    ) {
      this.cache = instance;
      this.isCached = true;
    }

    return instance;
  }
}

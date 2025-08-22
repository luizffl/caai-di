import {
  ModuleLifeCycle,
  DependencyModule,
  DynamicDependencyModule,
} from "./dependency-module";

export type ModuleDescription = {
  name: string;
  type: string;
  lifeCycle?: ModuleLifeCycle;
  resolved?: boolean;
};

export class ModuleContainer {
  private modules: Map<string, DependencyModule<any>> = new Map();
  private rootModules: Map<string, DependencyModule<any>> = new Map();
  private scopes: Map<string, Map<string, DependencyModule<any>>> = new Map();

  async resolveModule<T>(name: string, scopeName?: string): Promise<T> {
    if (scopeName && !this.scopes.has(scopeName)) {
      throw new Error(`Scope with name ${scopeName} does not exist.`);
    }

    const scopedModules = scopeName ? this.scopes.get(scopeName) : this.modules;
    const module = scopedModules?.get(name) ?? this.rootModules.get(name);

    if (!module) {
      throw new Error(`Module with name ${name} does not exist.`);
    }

    const containerReference = this;

    if (module instanceof DynamicDependencyModule && !module.isResolved) {
      const parameters = module.parametersNames.map((parameterName: string) => {
        return containerReference.resolveModule(parameterName, scopeName);
      });

      const resolvedParameters = await Promise.all(parameters);

      return module.resolve(...resolvedParameters);
    }

    return module.resolve();
  }

  registerModule<T>(module: DependencyModule<T>, name: string): void {
    if (this.modules.has(name) || this.rootModules.has(name)) {
      throw new Error(`Module with name ${name} already exists.`);
    }

    if (
      module instanceof DynamicDependencyModule &&
      module.lifeCycle === ModuleLifeCycle.SCOPED
    ) {
      this.modules.set(name, module);

      this.scopes.forEach((scope) => {
        scope.set(
          name,
          new (module.constructor as any)(module.resolver, module.lifeCycle)
        );
      });
    } else {
      this.rootModules.set(name, module);
    }
  }

  registerModules(modules: { [name: string]: DependencyModule<any> }): void {
    Object.entries(modules).forEach(([name, module]) => {
      this.registerModule(module, name);
    });
  }

  removeModule(name: string): void {
    if (this.modules.has(name)) {
      this.modules.delete(name);
      this.scopes.forEach((scope) => {
        scope.delete(name);
      });
    }

    if (this.rootModules.has(name)) {
      this.rootModules.delete(name);
    }
  }

  createScope(scopeName: string): void {
    if (this.scopes.has(scopeName)) {
      throw new Error(`Scope with name ${scopeName} already exists.`);
    }
    this.scopes.set(scopeName, new Map());

    this.modules.forEach((module, name) => {
      if (
        module instanceof DynamicDependencyModule &&
        module.lifeCycle === ModuleLifeCycle.SCOPED
      ) {
        const cloneModule = new (module.constructor as any)(
          module.resolver,
          module.lifeCycle
        );
        this.scopes.get(scopeName)?.set(name, cloneModule);
      }
    });
  }

  listModules(): ModuleDescription[] {
    return Array.from(this.modules.entries())
      .concat(Array.from(this.rootModules.entries()))
      .map(([name, module]) => {
        const description: ModuleDescription = {
          name,
          type: module.constructor.name,
        };

        if (module instanceof DynamicDependencyModule) {
          description.lifeCycle = module.lifeCycle;
          description.resolved = module.isResolved;
        }

        return description;
      });
  }

  listScopes(): string[] {
    return Array.from(this.scopes.keys());
  }

  deleteScope(scopeName: string): void {
    if (!this.scopes.has(scopeName)) {
      throw new Error(`Scope with name ${scopeName} does not exist.`);
    }
    this.scopes.delete(scopeName);
  }
}

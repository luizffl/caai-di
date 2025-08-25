# Caai DI

`@caai/di` is a minimalist TypeScript dependency injection library for Node.js that automatically resolves and injects dependencies into constructors and functions. Designed with zero external dependencies, it powers the Caai framework and is ideal for projects that value simplicity, type safety, and flexibility.

---

## Features

- **Automatic Dependency Resolution**: Resolves and injects dependencies by parameter names.
- **Multiple Module Types**: Supports value, function, and class modules.
- **Lifecycle Management**: Singleton, transient, and scoped lifecycles.
- **Zero Dependencies**: Lightweight and fast, with no external runtime dependencies.
- **TypeScript-first**: Designed for strong typing and developer ergonomics.

---

## Concepts

### Modules

A **module** is a unit of dependency that can be registered and resolved. There are several types:

- **ValueDependencyModule**: Wraps a static value.
- **FunctionDependencyModule**: Wraps a function, with dependencies injected by parameter name.
- **ClassDependencyModule**: Wraps a class constructor, with dependencies injected by parameter name.

### Lifecycles

- **SINGLETON**: One instance per container.
- **TRANSIENT**: New instance on every resolve.
- **SCOPED**: One instance per scope.

### Scopes

Scopes allow you to create isolated containers for dependencies, useful for request-based or session-based lifetimes.

---

## Installation

```sh
npm install @caai/di
```

---

## Usage

### 1. Registering and Resolving Values

```ts
import { ModuleContainer, ValueDependencyModule } from "@caai/di";

const container = new ModuleContainer();
container.registerModule(new ValueDependencyModule("hello world"), "greeting");

const greeting = await container.resolveModule<string>("greeting");
console.log(greeting); // "hello world"
```

### 2. Function Injection

```ts
import {
  ModuleContainer,
  FunctionDependencyModule,
  ValueDependencyModule,
  ModuleLifeCycle,
} from "@caai/di";

const container = new ModuleContainer();
container.registerModule(new ValueDependencyModule("Alice"), "name");
container.registerModule(
  new FunctionDependencyModule(
    (name: string) => `Hello, ${name}!`,
    ModuleLifeCycle.SINGLETON
  ),
  "greeter"
);

const message = await container.resolveModule<string>("greeter");
console.log(message); // "Hello, Alice!"
```

### 3. Class Injection

```ts
import {
  ModuleContainer,
  ClassDependencyModule,
  ValueDependencyModule,
  ModuleLifeCycle,
} from "@caai/di";

class UserService {
  constructor(public username: string) {}
}

const container = new ModuleContainer();
container.registerModule(new ValueDependencyModule("bob"), "username");
container.registerModule(
  new ClassDependencyModule(UserService, ModuleLifeCycle.SINGLETON),
  "userService"
);

const userService = await container.resolveModule<UserService>("userService");
console.log(userService.username); // "bob"
```

### 4. Scoped Lifecycles

```ts
import {
  ModuleContainer,
  FunctionDependencyModule,
  ModuleLifeCycle,
  ValueDependencyModule,
} from "@caai/di";

const container = new ModuleContainer();
container.registerModule(new ValueDependencyModule("foo"), "x");
container.registerModule(
  new FunctionDependencyModule((x: string) => x + "!", ModuleLifeCycle.SCOPED),
  "shout"
);

container.createScope("myscope");
const shoutDefault = await container.resolveModule("shout"); // "foo!"
container.removeModule("x");
container.registerModule(new ValueDependencyModule("bar"), "x");
const shoutScoped = await container.resolveModule("shout", "myscope"); // "bar!"
```

---

## API Reference

See the index.ts and dependency-module.ts for full API details.

---

## License

ISC © [Luiz Leite (luizffl)](https://github.com/luizffl)

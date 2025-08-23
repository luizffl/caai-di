import { describe, it, expect } from "vitest";
import {
  ModuleLifeCycle,
  StaticDependencyModule,
  ValueDependencyModule,
  DynamicDependencyModule,
  FunctionDependencyModule,
  ClassDependencyModule,
} from "../src/dependency-module";

describe("StaticDependencyModule", () => {
  class MyStaticModule extends StaticDependencyModule<number> {
    constructor(value: number) {
      super(value);
    }
  }

  it("returns the static value", () => {
    const mod = new MyStaticModule(42);
    expect(mod.resolve()).toBe(42);
  });

  it("to be an instance of StaticDependencyModule", () => {
    const mod = new MyStaticModule(100);
    expect(mod).toBeInstanceOf(StaticDependencyModule);
  });
});

describe("ValueDependencyModule", () => {
  it("returns the value", () => {
    const mod = new ValueDependencyModule("hello");
    expect(mod.resolve()).toBe("hello");
  });

  it("is an instance of StaticDependencyModule", () => {
    const mod = new ValueDependencyModule(123);
    expect(mod).toBeInstanceOf(StaticDependencyModule);
  });
});

describe("DynamicDependencyModule", () => {
  class MyDynamicModule extends DynamicDependencyModule<number> {
    public called = false;
    constructor(
      resolver: (...args: any[]) => number,
      lifeCycle?: ModuleLifeCycle
    ) {
      super(resolver, lifeCycle);
    }
    resolve(...args: any[]) {
      this.called = true;
      return (this.resolver as (...args: any[]) => number)(...args);
    }
  }

  it("calls the resolver function", () => {
    const mod = new MyDynamicModule((a: number, b: number) => a + b);
    expect(mod.resolve(2, 3)).toBe(5);
    expect(mod.called).toBe(true);
  });

  it("returns parameter names using getParametersNames", () => {
    const mod = new MyDynamicModule((x: number, y: string) => 1);
    expect(mod.parametersNames).toEqual(["x", "y"]);
  });

  it("isResolved reflects cache state", () => {
    const mod = new MyDynamicModule((a: number) => a * 2);
    expect(mod.isResolved).toBe(false);
    (mod as any).isCached = true;
    expect(mod.isResolved).toBe(true);
  });
});

describe("FunctionDependencyModule", () => {
  it("resolves and caches value for SINGLETON", async () => {
    let count = 0;
    const mod = new FunctionDependencyModule(
      () => ++count,
      ModuleLifeCycle.SINGLETON
    );
    expect(await mod.resolve()).toBe(1);
    expect(await mod.resolve()).toBe(1); // cached
  });

  it("does not cache value for TRANSIENT", async () => {
    let count = 0;
    const mod = new FunctionDependencyModule(
      () => ++count,
      ModuleLifeCycle.TRANSIENT
    );
    expect(await mod.resolve()).toBe(1);
    expect(await mod.resolve()).toBe(2);
  });

  it("caches value for SCOPED", async () => {
    let count = 0;
    const mod = new FunctionDependencyModule(
      () => ++count,
      ModuleLifeCycle.SCOPED
    );
    expect(await mod.resolve()).toBe(1);
    expect(await mod.resolve()).toBe(1);
  });

  it("awaits async resolver", async () => {
    const mod = new FunctionDependencyModule(
      async () => "async",
      ModuleLifeCycle.SINGLETON
    );
    expect(await mod.resolve()).toBe("async");
  });
});

describe("ClassDependencyModule", () => {
  class MyClass {
    value: number;
    constructor(x: number) {
      this.value = x;
    }
  }

  it("creates new instance and caches for SINGLETON", async () => {
    const mod = new ClassDependencyModule(MyClass, ModuleLifeCycle.SINGLETON);
    const sampleValues = [10, 20];
    const inst1 = await mod.resolve(sampleValues[0]);
    const inst2 = await mod.resolve(sampleValues[1]);
    expect(inst1).toBe(inst2);
    expect(inst1.value).toBe(sampleValues[0]);
  });

  it("creates new instance for TRANSIENT", async () => {
    const mod = new ClassDependencyModule(MyClass, ModuleLifeCycle.TRANSIENT);
    const sampleValues = [1, 2];
    const inst1 = await mod.resolve(sampleValues[0]);
    const inst2 = await mod.resolve(sampleValues[1]);
    expect(inst1).not.toBe(inst2);
    expect(inst1.value).toBe(sampleValues[0]);
    expect(inst2.value).toBe(sampleValues[1]);
  });

  it("creates new instance and caches for SCOPED", async () => {
    const mod = new ClassDependencyModule(MyClass, ModuleLifeCycle.SCOPED);
    const sampleValues = [5, 6];
    const inst1 = await mod.resolve(sampleValues[0]);
    const inst2 = await mod.resolve(sampleValues[1]);
    expect(inst1).toBe(inst2);
    expect(inst1.value).toBe(sampleValues[0]);
  });
});

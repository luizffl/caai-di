import { describe, it, expect, beforeEach } from "vitest";
import { ModuleContainer } from "../src/module-container";
import {
  ModuleLifeCycle,
  ValueDependencyModule,
  FunctionDependencyModule,
  ClassDependencyModule,
} from "../src/dependency-module";

class SampleClass {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}

describe("ModuleContainer", () => {
  let container: ModuleContainer;

  beforeEach(() => {
    container = new ModuleContainer();
  });

  it("registers and resolves a static dependency", async () => {
    container.registerModule(new ValueDependencyModule<string>("foo"), "foo");
    expect(await container.resolveModule("foo")).toBe("foo");
  });

  it("throws when registering a module with duplicate name", () => {
    container.registerModule(new ValueDependencyModule<number>(0), "dup");
    expect(() =>
      container.registerModule(new ValueDependencyModule<number>(1), "dup")
    ).toThrow();
  });

  it("removes modules from container", async () => {
    container.registerModule(new ValueDependencyModule<number>(1), "a");
    container.removeModule("a");
    await expect(container.resolveModule("a")).rejects.toThrow();
  });

  it("registers and resolves a singleton dynamic dependency with parameters", async () => {
    container.registerModule(new ValueDependencyModule("A"), "a");
    container.registerModule(new ValueDependencyModule("B"), "b");
    container.registerModule(
      new FunctionDependencyModule(
        (a: string, b: string) => a + b,
        ModuleLifeCycle.SINGLETON
      ),
      "sum"
    );
    expect(await container.resolveModule("sum")).toBe("AB");

    container.removeModule("a");
    container.registerModule(new ValueDependencyModule("C"), "a");
    expect(await container.resolveModule("sum")).toBe("AB");

    container.createScope("scope1");
    expect(await container.resolveModule("sum", "scope1")).toBe("AB");
  });

  it("registers and resolves a scoped dynamic dependency", async () => {
    container.registerModule(
      new FunctionDependencyModule(
        (x: string) => x + "!",
        ModuleLifeCycle.SCOPED
      ),
      "shout"
    );
    container.registerModule(new ValueDependencyModule("hi"), "x");
    container.createScope("myscope");
    expect(await container.resolveModule("shout")).toBe("hi!");

    container.removeModule("x");
    container.registerModule(new ValueDependencyModule("hello"), "x");
    expect(await container.resolveModule("shout")).toBe("hi!");
    expect(await container.resolveModule("shout", "myscope")).toBe("hello!");
  });

  it("throws if resolving a module that does not exist", async () => {
    await expect(container.resolveModule("nope")).rejects.toThrow();
  });

  it("throws if resolving a module in a non-existent scope", async () => {
    container.registerModule(new ValueDependencyModule("foo"), "foo");
    await expect(container.resolveModule("foo", "noscope")).rejects.toThrow();
  });

  it("creates and deletes scopes", () => {
    container.createScope("scope1");
    expect(container.listScopes()).toContain("scope1");
    container.deleteScope("scope1");
    expect(container.listScopes()).not.toContain("scope1");
  });

  it("throws if creating a scope that already exists", () => {
    container.createScope("scope1");
    expect(() => container.createScope("scope1")).toThrow();
  });

  it("throws if deleting a scope that does not exist", () => {
    expect(() => container.deleteScope("nope")).toThrow();
  });

  it("registers multiple modules at once", async () => {
    container.registerModules({
      a: new ValueDependencyModule(1),
      b: new ValueDependencyModule(2),
    });
    expect(await container.resolveModule("a")).toBe(1);
    expect(await container.resolveModule("b")).toBe(2);
  });

  it("listModules returns correct descriptions", async () => {
    container.registerModule(new ValueDependencyModule("foo"), "fooMod");
    container.registerModule(
      new FunctionDependencyModule(() => "bar", ModuleLifeCycle.SINGLETON),
      "barMod"
    );
    container.registerModule(
      new ClassDependencyModule(SampleClass, ModuleLifeCycle.TRANSIENT),
      "fooBarMod"
    );

    await container.resolveModule("barMod");

    const modules = container.listModules();

    console.log("MY MODULES => \n\n", modules, "\n");
    expect(modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "fooMod",
          type: "ValueDependencyModule",
        }),
        expect.objectContaining({
          name: "barMod",
          type: "FunctionDependencyModule",
          lifeCycle: ModuleLifeCycle.SINGLETON,
          resolved: true,
        }),
        expect.objectContaining({
          name: "fooBarMod",
          type: "ClassDependencyModule",
          lifeCycle: ModuleLifeCycle.TRANSIENT,
          resolved: false,
        }),
      ])
    );
  });

  it("removes modules from scopes when removed", () => {
    container.registerModule(
      new FunctionDependencyModule(() => "scoped", ModuleLifeCycle.SCOPED),
      "scopedMod"
    );
    container.createScope("scope1");
    container.removeModule("scopedMod");
    expect(() =>
      container.resolveModule("scopedMod", "scope1")
    ).rejects.toThrowError();
  });
});

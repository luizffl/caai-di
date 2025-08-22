import { describe, it, expect } from "vitest";
import { getParametersNames } from "../src/helpers";

// src/helpers.test.ts

describe("getParametersNames", () => {
  it("returns parameter names for a function with multiple parameters", () => {
    function test(a: any, b: number, c: string) {}
    expect(getParametersNames(test)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for a function with no parameters", () => {
    function test() {}
    expect(getParametersNames(test)).toEqual([]);
  });

  it("returns parameter name for a function with one parameter", () => {
    function test(x) {}
    expect(getParametersNames(test)).toEqual(["x"]);
  });

  it("removes inline comments from parameters", () => {
    function test(a /* first */, b /* second */) {}
    expect(getParametersNames(test)).toEqual(["a", "b"]);
  });

  it("works with arrow functions", () => {
    const fn = (x, y) => x + y;
    expect(getParametersNames(fn)).toEqual(["x", "y"]);
  });

  it("handles default parameter values", () => {
    function test(a = 1, b = "foo") {}
    expect(getParametersNames(test)).toEqual(["a", "b"]);
  });

  it("handles destructured parameters", () => {
    function test({ a, b }, [c, d]) {}
    expect(getParametersNames(test)).toEqual(["{ a, b }", "[c, d]"]);
  });

  it("handles rest parameters", () => {
    function test(...args) {}
    expect(getParametersNames(test)).toEqual(["...args"]);
  });

  it("returns empty array for invalid input", () => {
    // @ts-ignore
    expect(getParametersNames(null)).toEqual([]);
  });

  it("returns parameter names for a class constructor", () => {
    class MyClass {
      constructor(a: number, b: string) {}
    }
    expect(getParametersNames(MyClass)).toEqual(["a", "b"]);
  });

  it("returns parameter names for a class constructor with no parameters", () => {
    class MyClass {
      constructor() {}
    }
    expect(getParametersNames(MyClass)).toEqual([]);
  });

  it("returns parameter names for a class constructor with destructured parameters", () => {
    class MyClass {
      constructor({ x, y }, [a, b]) {}
    }
    expect(getParametersNames(MyClass)).toEqual(["{ x, y }", "[a, b]"]);
  });

  it("returns parameter names for a class constructor with rest parameters", () => {
    class MyClass {
      constructor(...args: any[]) {}
    }
    expect(getParametersNames(MyClass)).toEqual(["...args"]);
  });

  it("returns parameter names for a class constructor with default values", () => {
    class MyClass {
      constructor(a = 10, b = "bar") {}
    }
    expect(getParametersNames(MyClass)).toEqual(["a", "b"]);
  });

  it("returns parameter names for a function with TypeScript type annotations", () => {
    // Type annotations are stripped in JS, but let's test the parser
    function test(a: number, b: string) {}
    expect(getParametersNames(test)).toEqual(["a", "b"]);
  });

  it("returns parameter names for a function with no parentheses (single param arrow)", () => {
    const fn = (x) => x * 2;
    expect(getParametersNames(fn)).toEqual(["x"]);
  });

  it("returns parameter names for a function with complex inline comments", () => {
    function test(a /* first param, with, commas */, b /* second */) {}
    expect(getParametersNames(test)).toEqual(["a", "b"]);
  });

  it("returns parameter names for a function with whitespace and newlines", () => {
    function test(a, b, c) {}
    expect(getParametersNames(test)).toEqual(["a", "b", "c"]);
  });
});

export function getParametersNames(fn: Function): string[] {
  if (!fn || typeof fn !== "function") return [];

  let fnString = fn.toString();

  // Handle class constructors
  if (/^class\s/.test(fnString)) {
    const constructorMatch = fnString.match(/constructor\s*\(([^)]*)\)/s);
    if (!constructorMatch || !constructorMatch[1]) return [];
    fnString = `(${constructorMatch[1]}) => {}`;
  }

  // Try to extract parameter list from function or arrow function
  let match = fnString.match(/^[^(]*\(\s*([^)]*)\)/s);
  if (!match) {
    // Try to match single param arrow function: x => x*2
    match = fnString.match(/^([a-zA-Z0-9_$]+)\s*=>/);
    if (match) {
      return [match[1].trim()];
    }
    return [];
  }

  const paramsString = match[1];

  // Split parameters by commas, but ignore commas inside {}, [], or ()
  const params: string[] = [];
  let depth = 0;
  let current = "";
  let inString: string | null = null;

  for (let i = 0; i < paramsString.length; i++) {
    const char = paramsString[i];

    if (inString) {
      current += char;
      if (char === inString && paramsString[i - 1] !== "\\") {
        inString = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      inString = char;
      current += char;
      continue;
    }

    if (char === "{" || char === "[" || char === "(") {
      depth++;
      current += char;
      continue;
    }
    if (char === "}" || char === "]" || char === ")") {
      depth--;
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      params.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) params.push(current);

  // Clean up each parameter
  return params
    .map((param) =>
      param
        // Remove inline comments
        .replace(/\/\*.*?\*\//g, "")
        // Remove TypeScript type annotations
        .replace(/:[^=,]+(?=[=,}]|$)/g, "")
        // Remove default values (but keep destructured objects/arrays)
        .replace(/=[^,]+(?=(,|$))/g, "")
        .trim()
    )
    .filter(Boolean);
}

export function getParametersNames(fn: Function): string[] {
  if (!fn || typeof fn !== "function") return [];

  let fnString = fn.toString();

  // Handle class constructors
  if (/^class\s/.test(fnString)) {
    const constructorRegex = /constructor\s*\(([^)]*)\)/s;
    const constructorMatch = constructorRegex.exec(fnString);
    if (!constructorMatch?.[1]) return [];
    fnString = `(${constructorMatch[1]}) => {}`;
  }

  // Try to extract parameter list from function or arrow function
  let paramsString = extractParamsString(fnString);
  if (paramsString === null) return [];

  const params = splitParams(paramsString);

  return params.map(cleanParam).filter(Boolean);
}

function extractParamsString(fnString: string): string | null {
  let paramRegex = /^[^(]*\(\s*([^)]*)\)/s;
  let match = paramRegex.exec(fnString);
  if (match) return match[1];

  // Try to match single param arrow function: x => x*2
  let arrowParamRegex = /^([a-zA-Z0-9_$]+)\s*=>/;
  match = arrowParamRegex.exec(fnString);
  if (match) return match[1];

  return null;
}

function splitParams(paramsString: string): string[] {
  const params: string[] = [];
  let depth = 0;
  let current = "";
  let inString: string | null = null;

  for (let i = 0; i < paramsString.length; i++) {
    const char = paramsString[i];

    if (inString) {
      current += char;
      if (char === inString && paramsString[i - 1] !== "\\") inString = null;
    } else if (char === "'" || char === '"' || char === "`") {
      inString = char;
      current += char;
    } else if ("{[(".includes(char)) {
      depth++;
      current += char;
    } else if ("}])".includes(char)) {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      params.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) params.push(current);
  return params;
}

function cleanParam(param: string): string {
  return param
    .replace(/\/\*.*?\*\//g, "") // Remove inline comments
    .replace(/:[^=,]+(?=[=,}]|$)/g, "") // Remove TypeScript type annotations
    .replace(/=[^,]+(?=(,|$))/g, "") // Remove default values
    .trim();
}

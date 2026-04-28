import pc from 'picocolors';

const JSON_TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false)\b|\b(null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g;
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

export type ColorizeJsonOptions = {
  color?: boolean;
};

export function colorizeJson(value: unknown, options: ColorizeJsonOptions = {}): string {
  const json = JSON.stringify(value, null, 2);
  const color = options.color ?? shouldColorStdout();

  if (!color) return json;

  const colors = pc.createColors(true);
  return json.replace(JSON_TOKEN, (token, key, str, bool, nil) => {
    if (key) return colors.cyan(token);
    if (str) return colors.green(token);
    if (bool) return colors.yellow(token);
    if (nil) return colors.gray(token);
    return colors.magenta(token);
  });
}

export function stripAnsi(value: string): string {
  return value.replace(ANSI, '');
}

function shouldColorStdout(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return process.env.FORCE_COLOR !== '0';
  return Boolean(process.stdout.isTTY);
}

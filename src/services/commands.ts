// C — Command Prompt engine (spec §3.3). Pure: it returns what should happen
// and the widget performs it, so everything here is unit-testable.
//
// A web page or MV3 extension cannot spawn processes, so "elevated terminal
// launch" is delivered as a ready-to-paste launcher line copied to the
// clipboard (Win+R on Windows, a shell elsewhere) rather than executed.

import { normalizeUrl } from '../utils';

export type CommandResult =
  | { kind: 'open'; url: string; message: string }
  | { kind: 'output'; message: string } // show text (calc, base64, help)
  | { kind: 'copy'; text: string; message: string } // put text on the clipboard
  | { kind: 'error'; message: string };

export interface CommandSite {
  name: string;
  url: string;
}

export interface CommandContext {
  admin: boolean;
  platform: 'windows' | 'mac' | 'linux';
  sites: readonly CommandSite[];
}

export const COMMANDS: ReadonlyArray<{ name: string; usage: string; help: string }> = [
  { name: 'gh', usage: 'gh <owner/repo | query>', help: 'Open a GitHub repo or search GitHub' },
  { name: 'npm', usage: 'npm <package>', help: 'Open an npm package page' },
  { name: 'open', usage: 'open <url | site name>', help: 'Open a URL or one of your sites' },
  { name: 'g', usage: 'g <query>', help: 'Google search' },
  { name: 'calc', usage: 'calc <expression>', help: 'Evaluate arithmetic: + - * / % ^ ( )' },
  { name: 'b64e', usage: 'b64e <text>', help: 'Base64-encode text' },
  { name: 'b64d', usage: 'b64d <base64>', help: 'Base64-decode text' },
  { name: 'help', usage: 'help', help: 'List commands' },
];

export function parseCommand(input: string): { name: string; arg: string } {
  const trimmed = input.trim().replace(/^>\s*/, '');
  const space = trimmed.indexOf(' ');
  return space === -1
    ? { name: trimmed.toLowerCase(), arg: '' }
    : { name: trimmed.slice(0, space).toLowerCase(), arg: trimmed.slice(space + 1).trim() };
}

export function detectPlatform(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent): CommandContext['platform'] {
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'mac';
  return 'linux';
}

// Single quotes are the only special character inside a PowerShell
// single-quoted string; they are escaped by doubling.
const psQuote = (s: string) => `'${s.replace(/'/g, "''")}'`;

// A one-liner that, pasted into Win+R / a terminal, opens an elevated shell
// already running `cmd`.
export function elevatedLauncher(cmd: string, platform: CommandContext['platform']): string {
  if (platform === 'windows') {
    const args = `${psQuote('-NoExit')},${psQuote('-Command')},${psQuote(cmd)}`;
    // The outer double-quoted -Command string must not contain raw double quotes.
    return `powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -ArgumentList ${args.replace(/"/g, '\\"')}"`;
  }
  return `sudo ${cmd}`;
}

export function runCommand(input: string, ctx: CommandContext): CommandResult {
  const { name, arg } = parseCommand(input);
  if (!name) return { kind: 'error', message: 'Type a command — try "help".' };

  switch (name) {
    case 'help':
    case '?':
      return { kind: 'output', message: COMMANDS.map((c) => c.usage).join('  ·  ') };
    case 'gh': {
      if (!arg) return { kind: 'open', url: 'https://github.com', message: 'Opening GitHub' };
      const url = /^[\w.-]+\/[\w.-]+$/.test(arg)
        ? `https://github.com/${arg}`
        : `https://github.com/search?q=${encodeURIComponent(arg)}`;
      return { kind: 'open', url, message: `Opening ${url}` };
    }
    case 'npm': {
      if (!arg) return { kind: 'error', message: 'Usage: npm <package>' };
      const url = `https://www.npmjs.com/package/${arg.split(/\s+/)[0]}`;
      return { kind: 'open', url, message: `Opening ${url}` };
    }
    case 'g':
    case 'google': {
      if (!arg) return { kind: 'error', message: 'Usage: g <query>' };
      return {
        kind: 'open',
        url: `https://www.google.com/search?q=${encodeURIComponent(arg)}`,
        message: `Searching "${arg}"`,
      };
    }
    case 'open': {
      if (!arg) return { kind: 'error', message: 'Usage: open <url | site name>' };
      const lower = arg.toLowerCase();
      const site =
        ctx.sites.find((s) => s.name.toLowerCase() === lower) ??
        ctx.sites.find((s) => s.name.toLowerCase().startsWith(lower));
      if (site) return { kind: 'open', url: site.url, message: `Opening ${site.name}` };
      if (/^[^\s]+\.[^\s]+$/.test(arg)) {
        const url = normalizeUrl(arg);
        return { kind: 'open', url, message: `Opening ${url}` };
      }
      return { kind: 'error', message: `No site or URL matches "${arg}"` };
    }
    case 'calc':
    case '=': {
      try {
        return { kind: 'output', message: `${arg} = ${formatNumber(evaluate(arg))}` };
      } catch (err) {
        return { kind: 'error', message: err instanceof Error ? err.message : 'Invalid expression' };
      }
    }
    case 'b64e':
      return { kind: 'output', message: base64Encode(arg) };
    case 'b64d':
      try {
        return { kind: 'output', message: base64Decode(arg) };
      } catch {
        return { kind: 'error', message: 'Not valid base64' };
      }
    default: {
      const full = input.trim().replace(/^>\s*/, '');
      if (ctx.admin) {
        return {
          kind: 'copy',
          text: elevatedLauncher(full, ctx.platform),
          message:
            ctx.platform === 'windows'
              ? 'Elevated launcher copied — press Win+R, paste, Enter'
              : 'sudo command copied — paste into your terminal',
        };
      }
      return {
        kind: 'error',
        message: `Unknown command "${name}" — type help, or enable Admin to launch it in an elevated terminal`,
      };
    }
  }
}

// Tab completion: command names first, then site names after "open ".
export function complete(input: string, sites: readonly CommandSite[]): string | null {
  const { name, arg } = parseCommand(input);
  if (!input.includes(' ')) {
    const hit = COMMANDS.find((c) => c.name.startsWith(name) && c.name !== name);
    return hit ? `${hit.name} ` : null;
  }
  if (name === 'open' && arg) {
    const hit = sites.find((s) => s.name.toLowerCase().startsWith(arg.toLowerCase()));
    return hit ? `open ${hit.name}` : null;
  }
  return null;
}

// ---- base64 (UTF-8 safe) ---------------------------------------------------

export function base64Encode(text: string): string {
  let bin = '';
  for (const byte of new TextEncoder().encode(text)) bin += String.fromCharCode(byte);
  return btoa(bin);
}

export function base64Decode(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

// ---- calc: recursive-descent arithmetic (never eval) ------------------------

const formatNumber = (n: number) => String(Number.isInteger(n) ? n : Number(n.toPrecision(12)));

export function evaluate(expr: string): number {
  const tokens = expr.match(/\d*\.?\d+(?:e[+-]?\d+)?|[-+*/%^()]|\S/gi) ?? [];
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];

  // expr := term (('+'|'-') term)*
  const parseExpr = (): number => {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') v = take() === '+' ? v + parseTerm() : v - parseTerm();
    return v;
  };
  // term := unary (('*'|'/'|'%') unary)*
  const parseTerm = (): number => {
    let v = parseUnary();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = take();
      const r = parseUnary();
      if ((op === '/' || op === '%') && r === 0) throw new Error('Division by zero');
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  };
  // unary := ('-'|'+') unary | power   — so -2^2 = -(2^2), as in maths
  const parseUnary = (): number => {
    if (peek() === '-') return take(), -parseUnary();
    if (peek() === '+') return take(), parseUnary();
    return parsePower();
  };
  // power := atom ('^' unary)?   (right-associative; allows 2^-1)
  const parsePower = (): number => {
    const base = parseAtom();
    return peek() === '^' ? (take(), base ** parseUnary()) : base;
  };
  const parseAtom = (): number => {
    const t = take();
    if (t === '(') {
      const v = parseExpr();
      if (take() !== ')') throw new Error('Missing )');
      return v;
    }
    if (t !== undefined && /^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(t)) return Number(t);
    throw new Error(t === undefined ? 'Incomplete expression' : `Unexpected "${t}"`);
  };

  if (tokens.length === 0) throw new Error('Usage: calc <expression>');
  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`Unexpected "${tokens[pos]}"`);
  return result;
}

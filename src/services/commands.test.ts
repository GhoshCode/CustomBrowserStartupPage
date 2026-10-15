import { describe, expect, test } from 'vitest';
import {
  base64Decode,
  base64Encode,
  complete,
  detectPlatform,
  elevatedLauncher,
  evaluate,
  parseCommand,
  runCommand,
  type CommandContext,
} from './commands';

const ctx: CommandContext = {
  admin: false,
  platform: 'windows',
  sites: [
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Vercel', url: 'https://vercel.com' },
  ],
};

describe('evaluate', () => {
  test.each([
    ['1 + 2 * 3', 7],
    ['(1 + 2) * 3', 9],
    ['2 ^ 3 ^ 2', 512],
    ['-2 ^ 2', -4],
    ['2 ^ -1', 0.5],
    ['10 % 4', 2],
    ['.5 * 4', 2],
    ['1e3 / 8', 125],
  ])('%s = %d', (expr, value) => {
    expect(evaluate(expr)).toBe(value);
  });

  test.each(['1 +', '(1 + 2', '2 ** 3', 'alert(1)', '1 / 0'])('rejects %s', (expr) => {
    expect(() => evaluate(expr)).toThrow();
  });
});

test('base64 round-trips unicode', () => {
  expect(base64Encode('héllo ✓')).toBe('aMOpbGxvIOKckw==');
  expect(base64Decode('aMOpbGxvIOKckw==')).toBe('héllo ✓');
  expect(() => base64Decode('###')).toThrow();
});

test('parseCommand strips a leading prompt and lowercases the name', () => {
  expect(parseCommand('> GH  vercel/next.js ')).toEqual({ name: 'gh', arg: 'vercel/next.js' });
});

describe('runCommand', () => {
  test('gh opens repos directly and searches otherwise', () => {
    expect(runCommand('gh vercel/next.js', ctx)).toMatchObject({ kind: 'open', url: 'https://github.com/vercel/next.js' });
    expect(runCommand('gh state management', ctx)).toMatchObject({
      url: 'https://github.com/search?q=state%20management',
    });
  });

  test('open prefers your sites, then plain URLs', () => {
    expect(runCommand('open verc', ctx)).toMatchObject({ kind: 'open', url: 'https://vercel.com' });
    expect(runCommand('open example.org', ctx)).toMatchObject({ kind: 'open', url: 'https://example.org' });
    expect(runCommand('open nothing', ctx).kind).toBe('error');
  });

  test('calc and b64 produce output', () => {
    expect(runCommand('calc 6*7', ctx)).toEqual({ kind: 'output', message: '6*7 = 42' });
    expect(runCommand('b64e hi', ctx)).toEqual({ kind: 'output', message: 'aGk=' });
  });

  test('unknown commands error unless Admin is on', () => {
    expect(runCommand('ipconfig /flushdns', ctx).kind).toBe('error');
    const elevated = runCommand('ipconfig /flushdns', { ...ctx, admin: true });
    expect(elevated.kind).toBe('copy');
    if (elevated.kind === 'copy') expect(elevated.text).toContain('-Verb RunAs');
  });
});

describe('elevatedLauncher', () => {
  test('windows escapes single and double quotes', () => {
    const line = elevatedLauncher(`echo 'a' "b"`, 'windows');
    expect(line).toBe(
      `powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit','-Command','echo ''a'' \\"b\\"'"`,
    );
  });

  test('unix uses sudo', () => {
    expect(elevatedLauncher('apt update', 'linux')).toBe('sudo apt update');
  });
});

test('complete fills command names and site names', () => {
  expect(complete('ca', ctx.sites)).toBe('calc ');
  expect(complete('open git', ctx.sites)).toBe('open GitHub');
  expect(complete('zzz', ctx.sites)).toBeNull();
});

test('detectPlatform', () => {
  expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
  expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('mac');
  expect(detectPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux');
});

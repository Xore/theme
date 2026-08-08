#!/usr/bin/env node
/*
 * Structural validation for theme.css.
 *
 * Zero dependencies so it runs anywhere Node runs. It checks:
 *   - balanced comments, strings, braces, parentheses, and brackets
 *   - no external url() references except the approved Google Fonts CSS API
 *   - every var(--token) refers to a token defined somewhere in the file
 *
 * Usage: node scripts/check-css.mjs [file ...]
 */
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2).length ? process.argv.slice(2) : ['theme.css'];
let failures = 0;

function lineCol(source, index) {
  const upTo = source.slice(0, index);
  const line = upTo.split('\n').length;
  const col = index - upTo.lastIndexOf('\n');
  return `${line}:${col}`;
}

function checkStructure(file, css) {
  const problems = [];
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    const next = css[i + 1];
    if (ch === '/' && next === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) {
        problems.push(`unclosed comment at ${lineCol(css, i)}`);
        break;
      }
      i = end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) {
        if (css[j] === '\\') j += 1;
        if (css[j] === '\n') {
          problems.push(`newline inside string at ${lineCol(css, i)}`);
          break;
        }
        j += 1;
      }
      if (j >= css.length) {
        problems.push(`unclosed string at ${lineCol(css, i)}`);
        break;
      }
      i = j + 1;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push({ ch, at: i });
    } else if (ch === ')' || ch === ']' || ch === '}') {
      const open = stack.pop();
      if (!open || open.ch !== pairs[ch]) {
        problems.push(`unbalanced '${ch}' at ${lineCol(css, i)}`);
      }
    }
    i += 1;
  }
  for (const open of stack) {
    problems.push(`unclosed '${open.ch}' at ${lineCol(css, open.at)}`);
  }
  return problems;
}

function checkPolicy(file, css) {
  const problems = [];
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const isApprovedFontStylesheet = (target) =>
    target.startsWith('https://fonts.googleapis.com/css2?');
  const importPattern = /@import\s+url\(\s*(['"]?)([^'")]+)\1\s*\)\s*;/gi;
  let importMatch;
  while ((importMatch = importPattern.exec(withoutComments)) !== null) {
    if (!isApprovedFontStylesheet(importMatch[2].trim())) {
      problems.push(`unapproved @import target "${importMatch[2].trim()}" at ${lineCol(css, importMatch.index)}`);
    }
  }
  if (/@import\b/i.test(withoutComments.replace(importPattern, ''))) {
    problems.push('@import must use url() and the approved Google Fonts CSS API');
  }
  const urlPattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let match;
  while ((match = urlPattern.exec(withoutComments)) !== null) {
    const target = match[2].trim();
    if (!target.startsWith('data:') && !target.startsWith('#') && !isApprovedFontStylesheet(target)) {
      problems.push(`external url() reference "${target}" at ${lineCol(css, match.index)}`);
    }
  }
  return problems;
}

function checkTokens(file, css) {
  const problems = [];
  const defined = new Set();
  for (const match of css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) defined.add(match[1]);
  const used = new Set();
  for (const match of css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) used.add(match[1]);
  for (const token of used) {
    if (!defined.has(token)) problems.push(`var(${token}) is used but never defined`);
  }
  return problems;
}

for (const file of files) {
  const css = readFileSync(file, 'utf8');
  if (!css.trim()) {
    console.error(`✗ ${file}: file is empty`);
    failures += 1;
    continue;
  }
  const problems = [
    ...checkStructure(file, css),
    ...checkPolicy(file, css),
    ...checkTokens(file, css),
  ];
  if (problems.length) {
    failures += problems.length;
    for (const problem of problems) console.error(`✗ ${file}: ${problem}`);
  } else {
    console.log(`✓ ${file}: structure, policy, and token references OK`);
  }
}

process.exit(failures ? 1 : 0);

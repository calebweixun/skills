#!/usr/bin/env node
// Call one Premiere Pro MCP tool over stdio, for sessions where the
// mcp__premiere-pro__* tools are not loaded.
//
// Usage: node mcpcall.mjs <tool> ['<json args>']
// Env:   PREMIERE_MCP_ENTRY  path to Adobe_Premiere_Pro_MCP/dist/index.js (required)
//        PREMIERE_TEMP_DIR   bridge folder shared with the CEP panel (required)
//
// Tools outside the always-advertised set are wrapped in invoke_tool.
// A string value written as "WIN<C:/a/b.png>" becomes a backslash Windows path,
// which export_frame needs and which shells tend to mangle.
import { spawn } from 'node:child_process';
import path from 'node:path';

const ADVERTISED = new Set(['search_tools', 'get_tool_schema', 'invoke_tool', 'verify_premiere_connection', 'list_sequences']);
const [, , tool, rawArgs = '{}'] = process.argv;
const entry = process.env.PREMIERE_MCP_ENTRY;
if (!tool || !entry || !process.env.PREMIERE_TEMP_DIR) {
  console.error('usage: PREMIERE_MCP_ENTRY=... PREMIERE_TEMP_DIR=... node mcpcall.mjs <tool> [json]');
  process.exit(2);
}

const winPaths = (v) => {
  if (typeof v === 'string') {
    const m = v.match(/^WIN<(.*)>$/);
    return m ? path.win32.normalize(m[1]) : v;
  }
  if (Array.isArray(v)) return v.map(winPaths);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, winPaths(x)]));
  return v;
};
const args = winPaths(JSON.parse(rawArgs));
const call = ADVERTISED.has(tool) ? { name: tool, arguments: args } : { name: 'invoke_tool', arguments: { name: tool, arguments: args } };

const child = spawn(process.execPath, [entry], {
  env: { PREMIERE_MCP_TELEMETRY: '0', ...process.env },
  stdio: ['pipe', 'pipe', 'ignore'],
});
let buf = '';
const pending = new Map();
child.stdout.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    } catch { /* non-JSON log line */ }
  }
});
let nextId = 0;
const request = (method, params) => new Promise((resolve) => {
  const id = ++nextId;
  pending.set(id, resolve);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
});

const timer = setTimeout(() => { console.error('timeout'); child.kill(); process.exit(1); }, 180000);
const init = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'mcpcall', version: '1' } });
if (init.error) { console.error(JSON.stringify(init.error)); process.exit(1); }
child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
const res = await request('tools/call', call);
clearTimeout(timer);
child.kill();

let out = res.error ?? res.result;
if (res.result) {
  out = res.result.structuredContent;
  if (!out) {
    try { out = JSON.parse(res.result.content?.[0]?.text ?? 'null'); } catch { out = res.result; }
  }
}
console.log(JSON.stringify(out, null, 1));
process.exit(res.error || res.result?.isError ? 1 : 0);

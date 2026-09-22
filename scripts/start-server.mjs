import { spawn } from 'child_process';
import fs from 'fs';

const out = fs.openSync('server.log', 'a');
const err = fs.openSync('server.log', 'a');

const p = spawn('npx.cmd', ['next', 'dev', '-p', '3050'], {
  detached: true,
  shell: true,
  stdio: ['ignore', out, err]
});

p.unref();
console.log('Next.js launched with PID:', p.pid);

#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";

const tunnelHost = process.env.CAPSTONE_SSH_TUNNEL_HOST ?? "127.0.0.1";
const accessHostname = process.env.CAPSTONE_ACCESS_HOSTNAME ?? "capstone.leed.at";
const requestedPort = process.env.CAPSTONE_SSH_TUNNEL_PORT;
const pathValue = ["/opt/homebrew/bin", "/usr/local/bin", process.env.PATH ?? ""].filter(Boolean).join(":");
const env = { ...process.env, PATH: pathValue };
const cloudflaredBin = resolveBin(process.env.CLOUDFLARED_BIN, ["/opt/homebrew/bin/cloudflared", "/usr/local/bin/cloudflared"], "cloudflared");
const npxBin = resolveBin(process.env.NPX_BIN, ["/opt/homebrew/bin/npx", "/usr/local/bin/npx"], "npx");
const passthroughArgs = stripArg(stripArg(process.argv.slice(2), "--host"), "--port");
const tunnelPort = await getAvailablePort(requestedPort);
let shuttingDown = false;
let mcpProcess = null;

const tunnelProcess = spawn(
  cloudflaredBin,
  ["access", "tcp", "--hostname", accessHostname, "--url", `${tunnelHost}:${tunnelPort}`],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);

tunnelProcess.stdout.on("data", (chunk) => process.stderr.write(chunk));
tunnelProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));
tunnelProcess.on("error", (error) => {
  process.stderr.write(`cloudflared failed to start: ${error.message}\n`);
  process.exit(1);
});
tunnelProcess.on("exit", (code, signal) => {
  if (shuttingDown) {
    return;
  }

  const status = signal ?? String(code ?? 1);
  process.stderr.write(`cloudflared exited: ${status}\n`);

  if (mcpProcess && !mcpProcess.killed) {
    mcpProcess.kill("SIGTERM");
  }

  process.exit(typeof code === "number" && code !== 0 ? code : 1);
});

await waitForPort(tunnelPort, 10000);

mcpProcess = spawn(
  npxBin,
  ["-y", "ssh-mcp@1.5.0", `--host=${tunnelHost}`, `--port=${tunnelPort}`, ...passthroughArgs],
  { cwd: process.cwd(), env, stdio: ["inherit", "inherit", "inherit"] },
);

mcpProcess.on("error", (error) => {
  process.stderr.write(`ssh-mcp failed to start: ${error.message}\n`);
  stopChildren("SIGTERM");
  process.exit(1);
});
mcpProcess.on("exit", (code, signal) => {
  stopChildren("SIGTERM");
  process.exit(typeof code === "number" ? code : signal ? 128 : 0);
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    stopChildren(signal);
    process.exit(128);
  });
}

function resolveBin(override, candidates, fallback) {
  if (override) {
    return override;
  }

  return candidates.find((candidate) => existsSync(candidate)) ?? fallback;
}

function stripArg(args, name) {
  const nextArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === name) {
      index += 1;
      continue;
    }

    if (arg.startsWith(`${name}=`)) {
      continue;
    }

    nextArgs.push(arg);
  }

  return nextArgs;
}

function getAvailablePort(preferredPort) {
  const port = preferredPort ? Number(preferredPort) : 0;

  if (Number.isNaN(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid CAPSTONE_SSH_TUNNEL_PORT: ${preferredPort}`);
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();
    server.on("error", reject);
    server.listen(port, tunnelHost, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Unable to reserve a local tunnel port")));
        return;
      }

      server.close(() => resolve(address.port));
    });
  });
}

async function waitForPort(port, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnect(port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  stopChildren("SIGTERM");
  throw new Error(`Timed out waiting for cloudflared tunnel on ${tunnelHost}:${port}`);
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: tunnelHost, port });

    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.setTimeout(200, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function stopChildren(signal) {
  shuttingDown = true;

  if (mcpProcess && !mcpProcess.killed) {
    mcpProcess.kill(signal);
  }

  if (!tunnelProcess.killed) {
    tunnelProcess.kill(signal);
  }
}

# Capstone SSH MCP 설정 기록

## 반영 내용

- `ssh-mcp@1.5.0`가 OpenSSH 설정의 `ProxyCommand`를 읽지 않고 `ssh2` 직접 TCP 연결을 사용하는 것을 확인했다.
- `capstone.leed.at:22` 직접 MCP 연결은 SSH handshake timeout으로 실패했다.
- `cloudflared access tcp` 로컬 터널을 먼저 연 뒤 `ssh-mcp`를 `127.0.0.1` 터널 포트로 연결하면 MCP `exec` 호출이 성공하는 것을 확인했다.
- `scripts/run_capstone_ssh_mcp.mjs`를 추가해 Codex MCP 실행 시 `cloudflared access tcp` 터널을 자동으로 띄우고, `ssh-mcp@1.5.0`을 해당 로컬 터널로 연결하도록 했다.
- 로컬 `.codex/config.toml`의 `ssh_mcp` 서버 실행 커맨드를 래퍼 스크립트 호출 방식으로 변경했다.

## 기준

- OpenSSH 접속 자체는 `Host capstone.leed.at`의 `ProxyCommand cloudflared access ssh --hostname %h` 설정을 사용한다.
- `ssh-mcp@1.5.0`은 OpenSSH 설정을 사용하지 않으므로, MCP에서는 `cloudflared access tcp` 기반 로컬 터널을 사용한다.
- Codex 앱 PATH에는 `/opt/homebrew/bin`이 기본으로 없을 수 있으므로 래퍼에서 PATH에 `/opt/homebrew/bin`과 `/usr/local/bin`을 추가한다.
- `.codex/config.toml`은 git ignore 대상이라 로컬 설정으로만 유지한다.

## 검증 메모

- `ssh -G capstone.leed.at`에서 `proxycommand cloudflared access ssh --hostname %h`가 인식되는 것을 확인했다.
- `npx -y ssh-mcp@1.5.0 --host=capstone.leed.at --port=22 ...` MCP `exec` 호출은 `Timed out while waiting for handshake`로 실패했다.
- `cloudflared access tcp --hostname capstone.leed.at --url 127.0.0.1:2222` 실행 후 `ssh-mcp`를 `127.0.0.1:2222`에 연결한 MCP `exec` 호출은 `MCP_TUNNEL_OK`를 반환했다.
- `node --check scripts/run_capstone_ssh_mcp.mjs` 문법 검사를 통과했다.
- `node scripts/run_capstone_ssh_mcp.mjs ...` 래퍼를 통한 MCP `exec` 호출은 `MCP_WRAPPER_OK`를 반환했다.
- repository 내 `package.json`, `tsconfig.json`, eslint 설정 파일이 없어 TypeScript 및 eslint 실행 대상은 없다.

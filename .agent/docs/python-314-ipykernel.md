# Python 3.14 ipykernel 설정

## 2026-05-27 작업 기록

- `/opt/homebrew/bin/python3`는 Python 3.14.4를 가리키고 있었다.
- 초기 상태에서 `ipykernel` 패키지가 없어 notebook cell 실행이 막혔다.
- `/opt/homebrew/bin/python3 -m pip install ipykernel -U --user --force-reinstall`는 Homebrew Python의 PEP 668 `externally-managed-environment` 정책으로 실패했다.
- 사용자 site-packages에만 설치되도록 `/opt/homebrew/bin/python3 -m pip install ipykernel -U --user --break-system-packages`로 `ipykernel`을 설치했다.
- VS Code와 Jupyter가 커널을 명확히 찾을 수 있도록 `/opt/homebrew/bin/python3 -m ipykernel install --user --name python314 --display-name "Python 3.14.4"`를 실행했다.

## 검증

- `/opt/homebrew/bin/python3`에서 `ipykernel` import가 성공했다.
- 설치된 `ipykernel` 버전은 `7.2.0`이다.
- 사용자 커널 스펙은 `/Users/dongzoolee/Library/Jupyter/kernels/python314/kernel.json`에 생성됐다.
- 커널 스펙의 실행 파일은 `/opt/homebrew/opt/python@3.14/bin/python3.14`다.
- 이 저장소에는 `package.json`이나 TypeScript/eslint 설정이 없어 TS/eslint 검증 대상은 없다.

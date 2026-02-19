# 패턴 배틀 — 60초 기억력 도전

사이먼 게임 스타일의 4x4 그리드 색상 패턴 기억 웹게임.

## 로컬 실행

```bash
# 정적 파일 서버로 실행 (아무거나 가능)
cd CLAUDE
python3 -m http.server 8080
# 또는
npx serve .
```

브라우저에서 `http://localhost:8080` 접속.

## 백엔드 (Cloudflare Workers + D1)

```bash
cd CLAUDE/worker
npm install

# D1 데이터베이스 생성
npm run db:create
# wrangler.toml에서 database_id를 업데이트

# 스키마 적용
npm run db:migrate

# 로컬 개발
npm run dev

# 배포
npm run deploy
```

Worker 배포 후 `js/ranking.js`에서 `Ranking.setApiBase('https://your-worker.workers.dev')`를 `js/app.js`의 `init()`에서 호출하세요.

## 배포 (Cloudflare Pages)

1. GitHub에 push
2. Cloudflare Pages에서 프로젝트 생성
3. 빌드 설정: 빌드 커맨드 없음, 출력 디렉토리 `CLAUDE/`
4. 배포

## 게임 규칙

- 60초 안에 최대한 많은 패턴을 기억하고 따라하세요
- 패턴 길이: 3에서 시작, 라운드마다 +1
- 오답 시: 같은 패턴 재시도, 0.5초 패널티, 콤보 리셋
- 콤보 보너스로 더 높은 점수를 노리세요

## 기술 스택

- **프론트엔드**: Vanilla JS + HTML/CSS (빌드 도구 없음)
- **백엔드**: Cloudflare Workers + D1 (SQLite)
- **배포**: Cloudflare Pages + Workers

# 글로벌 연기금 운용 논문 대시보드

OpenAlex / CrossRef에서 최신 연기금(Pension Fund) 관련 학술 논문을 자동 수집하고,  
주제별 분류·국기 표시·AI 한국어 요약을 제공하는 Next.js 대시보드입니다.

**GitHub Repository:** https://github.com/jeonju010-netizen/pension-papers-dashboard

## 주요 기능

- 4대 주제 분류: 자산배분 / 자산운용(주식·채권·대체투자) / 리스크관리 / 성과평가
- OpenAlex + CrossRef 기반 최신 논문 자동 수집
- 논문 hover 시 초록 팝업, 클릭 시 원문·AI 요약 확인
- 저자 소속 기반 국가 국기 표시

## 기술 스택

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- OpenAlex / CrossRef / OpenAI API

## 로컬 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/jeonju010-netizen/pension-papers-dashboard.git
cd pension-papers-dashboard

# 2. 패키지 설치
npm install

# 3. 환경변수 설정 (아래 참고)
cp .env.local.example .env.local
# .env.local 파일을 열어 API Key 입력

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## .env.local 설정 방법

`.env.local.example` 파일을 복사해 `.env.local`을 만든 뒤 값을 입력하세요.

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
OPENALEX_EMAIL=your-email@example.com
OPENALEX_API_KEY=
```

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | 권장 | AI 한국어 요약·번역 (미설정 시 초록 기반 fallback) |
| `OPENAI_MODEL` | 선택 | 기본값 `gpt-4o-mini` |
| `OPENALEX_EMAIL` | 선택 | OpenAlex polite pool 등록 이메일 |
| `OPENALEX_API_KEY` | 선택 | OpenAlex API 키 ([무료 발급](https://openalex.org/settings/api)) |

> **주의:** `.env.local` 파일과 실제 API Key는 **절대 GitHub에 커밋하지 마세요.**  
> `.gitignore`에 이미 등록되어 있습니다.

## Vercel 배포 방법

1. [Vercel](https://vercel.com) 로그인
2. **Add New → Project**
3. GitHub Repository `jeonju010-netizen/pension-papers-dashboard` Import
4. Framework Preset: **Next.js** (자동 감지)
5. **Environment Variables** 등록 (아래 참고)
6. **Deploy** 클릭

### Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables 에 아래 키를 등록하세요.

| Key | Production | Preview | Development |
|-----|------------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | ✅ | ✅ |
| `OPENAI_MODEL` | 선택 | 선택 | 선택 |
| `OPENALEX_EMAIL` | 선택 | 선택 | 선택 |
| `OPENALEX_API_KEY` | 선택 | 선택 | 선택 |
| `KV_REST_API_URL` | 권장 | 권장 | 선택 |
| `KV_REST_API_TOKEN` | 권장 | 권장 | 선택 |

> GitHub Repository에는 **placeholder만** 올리고, 실제 API Key는 **Vercel Environment Variables에만** 입력하세요.

### 방문자 수 (Vercel KV)

프로덕션(Vercel)에서는 서버 `/tmp` 캐시가 인스턴스마다 따로라 방문자 수가 유지되지 않습니다. **Vercel KV**를 연결하면 중복 없는 방문자 수가 영구 저장됩니다.

1. Vercel Dashboard → Project → **Storage** → **Create Database** → **KV**
2. 프로젝트에 Connect (자동으로 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 주입)
3. Redeploy

로컬 개발은 `.cache/visitor-stats-v1.json` 파일로 동작합니다.

## 프로젝트 구조

```
src/
├── app/
│   ├── api/papers/          # 논문 수집 API
│   ├── api/papers/summarize/ # AI 요약 API
│   └── page.tsx             # 메인 페이지 (SSR 초기 데이터)
├── components/              # UI 컴포넌트
├── data/papers.ts           # fallback 샘플 논문
├── lib/                     # OpenAlex, CrossRef, OpenAI, 캐시
└── types/                   # TypeScript 타입
docs/
└── PRD.md                   # 제품 요구사항 문서
```

## 빌드 확인

```bash
npm run build
npm run lint
```

## Vercel 배포 전 체크리스트

- [ ] GitHub에 코드 push 완료 (`.env.local` 미포함 확인)
- [ ] Vercel에서 Repository Import
- [ ] Environment Variables 등록 (`OPENAI_API_KEY` 등)
- [ ] Vercel KV 연결 (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
- [ ] Deploy 클릭 후 Build Success 확인
- [ ] 배포 URL 접속 → 논문 목록 로딩 확인
- [ ] 주제 필터·국기·초록 hover 동작 확인
- [ ] 논문 선택 → **AI 요약 생성** 버튼 동작 확인
- [ ] **최신 논문 수집** 버튼 동작 확인
- [ ] API 실패 시 fallback 샘플 논문 표시 확인

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/papers` | 논문 목록 (캐시 또는 실시간 수집) |
| GET | `/api/papers?refresh=true` | 강제 재수집 |
| POST | `/api/papers/summarize` | AI 요약 생성 |

## 라이선스

교육용 프로젝트

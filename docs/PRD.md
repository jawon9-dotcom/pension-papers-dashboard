# PRD: 글로벌 연기금 운용 논문 대시보드

## 1. 개요

### 1.1 제품명
**Pension Papers Dashboard** — 글로벌 연기금(Pension Fund) 운용 관련 학술·산업 논문·리포트를 탐색·요약·열람할 수 있는 인터랙티브 웹 대시보드

### 1.2 목적
연기금 운용 담당자, 리서치 애널리스트, 자산운용 실무자가 최신 연구와 산업 자료를 빠르게 파악하고, 주제별로 분류된 논문을 탐색하며, 선택한 논문의 원문과 인용 네트워크를 한 화면에서 확인할 수 있도록 한다.

### 1.3 기술 스택
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **논문 수집**: OpenAlex API + CrossRef API
- **AI 요약**: OpenAI API (`gpt-4o-mini` 기본)
- **인용 네트워크**: OpenAlex related/cited-by/referenced works

---

## 2. 사용자 및 사용 시나리오

### 2.1 타깃 사용자
| 페르소나 | 니즈 |
|---------|------|
| 연기금 CIO / PM | 운용전략·리스크관리 최신 트렌드 파악 |
| 리서치 애널리스트 | 주제별 논문 큐레이션 및 요약 검토 |
| 리스크·성과평가 담당 | 성과평가·리스크관리 논문 집중 탐색 |

### 2.2 핵심 사용 시나리오
1. 사용자가 대시보드에 접속한다.
2. 좌측 필터에서 **4대 주제** 및 **하위 분류**를 선택한다.
3. 논문 목록에서 **저자 · 출처(학술지/유형)** 를 확인한다.
4. 논문을 **클릭**하면 상세 화면에서 AI 요약·초록·Connected Papers·원문을 **하나의 스크롤**로 탐색한다. (모바일)
5. Connected Papers 그래프로 유사·인용·참고 논문을 탐색한다.

---

## 3. 기능 요구사항

### 3.1 논문 분류 체계 (v3.0)

| 대분류 | 코드 | 표시명 | 하위 분류 |
|--------|------|--------|-----------|
| 운용전략 | `asset-allocation` | 운용전략 | SAA, TAA, TPA, 그 외 운용전략 |
| 자산운용 | `asset-management` | 자산운용 | 주식, 채권, 대체투자 |
| 리스크관리 | `risk-management` | 리스크관리 | — |
| 성과평가 | `performance-evaluation` | 성과평가 | — |

#### 운용전략 하위 분류
| 코드 | 표시명 |
|------|--------|
| `saa` | SAA(전략적 자산배분) |
| `taa` | TAA(전술적 자산배분) |
| `tpa` | TPA(기준포트폴리오) |
| `strategy-general` | 그 외 운용전략 |

### 3.2 화면 구성

- **데스크톱 (≥1024px)**: 좌측 목록 + 우측 상세 2-panel
- **모바일 (<1024px)**: 목록 ↔ 상세 전환, 상세는 **AI 요약부터 원문까지 단일 스크롤**

### 3.3 논문 수집 범위 (v3.0)

학계와 산업 전반을 포함하도록 검색 범위를 확장한다.

| 항목 | 내용 |
|------|------|
| OpenAlex | 16개 title.search 쿼리 (white paper, industry research, asset owner 등) |
| CrossRef | journal-article 한정 해제, 리포트·posted-content 등 포함 |
| 관련성 | pension/retirement + investment/portfolio/strategy/policy 등 넓은 맥락 키워드 |
| 수집량 | 기간당 최대 120건, 연도당 쿼리 4~5개 |

### 3.4 논문 목록 표시 (v3.0)

각 논문 카드에 다음 정보를 표시한다.
- 제목, 주제 배지, 인용 수
- **저자 · 출처** (학술지명 > publication type > source site 순)

### 3.5 Connected Papers (v2.1)

OpenAlex API 기반 인용 네트워크 시각화. [Citation Graph Builder](https://github.com/FZJ-IEK3-VSA/citation-graph-builder)의 citation network 개념을 참고.

- 유사 논문 (`related_works`)
- 인용 논문 (`cites` filter)
- 참고문헌 (`referenced_works`)

### 3.6 논문 데이터 필드

```typescript
interface Paper {
  id: string;
  openAlexId?: string;
  title: string;
  titleKo: string;
  authors: string[];
  year: number;
  journal: string;
  category: MainCategory;
  subCategory?: SubCategory;
  abstract: string;
  abstractKo: string;
  summaryKo: string;
  originalUrl: string;
  pdfUrl?: string;
  citationCount?: number;
  sourceSite?: string;
  publicationType?: string;
}
```

---

## 4. UI/UX 가이드

### 4.1 카테고리 색상
| 주제 | 색상 |
|------|------|
| 운용전략 | emerald |
| 자산운용 | blue |
| 리스크관리 | amber |
| 성과평가 | violet |

### 4.2 모바일 상세 스크롤 (v3.0)
- 「목록으로」 버튼은 상단 고정
- **AI 핵심 요약 → 초록 → Connected Papers → 논문 원본(PDF)** 까지 `.scroll-area` 단일 스크롤
- 메타 헤더(제목·저자)는 모바일에서 스크롤 영역 상단에 포함

---

## 5. 릴리스 이력

### v3.0 (현재)
- [x] 자산배분 → **운용전략** 명칭 변경
- [x] 운용전략 하위 4분류 (SAA/TAA/TPA/일반)
- [x] 모바일 상세 단일 스크롤 (AI 요약~원문)
- [x] 검색 범위 확대 (학술 + 산업 리포트/아티클)
- [x] 목록에 저자 옆 **출처** 표시

### v2.1
- [x] Connected Papers 인용 네트워크
- [x] 모바일 목록/상세 전환, 필터 접기

### v2.0
- [x] OpenAlex + CrossRef 자동 수집
- [x] AI 한국어 요약
- [x] 기간 필터, 인용 수, 정렬

### v1.0
- [x] 4대 주제 분류 + 자산운용 하위 3분류
- [x] 2-panel 레이아웃, hover 초록 팝업

---

## 6. API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/papers` | 논문 목록 |
| GET | `/api/papers?refresh=true` | 강제 재수집 |
| GET | `/api/papers/connected` | Connected Papers 그래프 |
| POST | `/api/papers/summarize` | AI 요약 |

---

## 7. 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | AI 요약 시 | OpenAI API 키 |
| `OPENALEX_EMAIL` | 선택 | OpenAlex polite pool |
| `OPENALEX_API_KEY` | 선택 | OpenAlex API 키 |

---

## 8. 성공 지표
- 모바일 상세 화면에서 AI 요약~원문까지 스크롤 1회로 탐색 가능
- 운용전략 하위 필터 선택 시 200ms 이내 목록 갱신
- 재수집 시 학술지 외 report/article 유형 포함률 증가

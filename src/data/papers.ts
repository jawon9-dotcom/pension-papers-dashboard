import { Paper } from "@/types/paper";

export const papers: Paper[] = [
  {
    id: "pa-001",
    title:
      "Strategic Asset Allocation for Public Pension Funds: A Dynamic Approach",
    titleKo: "공적 연기금의 전략적 자산배분: 동적 접근법",
    authors: ["Olivier Rousseau", "Pension Research Council"],
    year: 2024,
    journal: "Journal of Pension Economics & Finance",
    category: "asset-allocation",
    subCategory: "saa",
    abstract:
      "This paper examines dynamic asset allocation strategies for large public pension funds facing demographic shifts and low-yield environments. Using a liability-driven investment framework, we show that adaptive glide paths outperform static allocation policies by 80-120 basis points annually over a 20-year horizon.",
    abstractKo:
      "본 논문은 인구구조 변화와 저금리 환경에 직면한 대형 공적 연기금의 동적 자산배분 전략을 분석한다. 부채연동투자(LDI) 프레임워크를 활용하여, 적응형 글라이드 패스가 20년 기간 동안 정적 배분 정책 대비 연 80~120bp의 초과수익을 달성함을 보인다.",
    summaryKo:
      "인구 고령화와 저금리가 지속되는 환경에서 공적 연기금은 정적 자산배분의 한계를 극복하기 위해 동적 LDI 전략을 채택해야 한다. 특히 부채 듀레이션과 자산 듀레이션의 매칭을 지속적으로 조정하는 적응형 글라이드 패스가 핵심이다. 캐나다·네덜란드·호주 연기금 사례 분석 결과, 동적 배분은 펀딩 비율 안정성을 크게 개선했다.",
    originalUrl: "https://doi.org/10.1017/S1474747224000123",
    pdfUrl:
      "https://www.cambridge.org/core/services/aop-cambridge-core/content/view/sample",
  },
  {
    id: "pa-002",
    title:
      "Factor-Based Asset Allocation in Global Pension Portfolios",
    titleKo: "글로벌 연기금 포트폴리오의 팩터 기반 자산배분",
    authors: ["Angela Black", "Timothy Lane", "CPPIB Research"],
    year: 2025,
    journal: "Financial Analysts Journal",
    category: "asset-allocation",
    subCategory: "saa",
    abstract:
      "We propose a factor-based strategic asset allocation model for global pension funds that integrates macroeconomic regime detection with risk parity principles. Backtests across 15 OECD pension systems demonstrate improved Sharpe ratios and reduced maximum drawdowns.",
    abstractKo:
      "거시경제 레짐 탐지와 리스크 패리티 원칙을 통합한 팩터 기반 전략적 자산배분 모델을 제안한다. 15개 OECD 연기금 시스템에 대한 백테스트 결과, 샤프 비율이 개선되고 최대 낙폭이 감소하였다.",
    summaryKo:
      "전통적 60/40 배분은 팩터 노출의 비효율성을 내포한다. 본 연구는 거시 레짐(성장/스태그플레이션/긴축)별 팩터 프리미엄 변화를 반영한 SAA 모델을 제시한다. CPPIB·CalPERS 등 대형 연기금의 실제 배분 데이터를 활용한 검증에서 리스크 조정 수익률이 유의미하게 개선되었다.",
    originalUrl: "https://doi.org/10.1080/0015198X.2025.0012345",
  },
  {
    id: "am-eq-001",
    title:
      "Active Equity Management in Pension Funds: Evidence from Nordic Systems",
    titleKo: "연기금의 액티브 주식 운용: 북유럽 시스템 증거",
    authors: ["Erik Berg", "Norges Bank Investment Management"],
    year: 2024,
    journal: "Review of Finance",
    category: "asset-management",
    subCategory: "equity",
    abstract:
      "Analyzing 20 years of equity management data from Nordic public pension funds, we find that systematic factor tilts and ESG integration contribute more to net alpha than traditional stock-picking, after accounting for transaction costs and capacity constraints.",
    abstractKo:
      "북유럽 공적 연기금 20년간의 주식 운용 데이터를 분석한 결과, 거래비용과 용량 제약을 감안할 때 전통적 종목 선별보다 체계적 팩터 틸트와 ESG 통합이 순 알파에 더 크게 기여한다.",
    summaryKo:
      "대형 연기금의 액티브 주식 운용에서 종목 선별(alpha)보다 팩터 노출 관리와 ESG 통합이 실질적 초과수익의 주요 원천이다. NBIM·AP4 등 북유럽 연기금 사례에서 ESG 통합 포트폴리오가 벤치마크 대비 연 40~60bp의 지속적 초과수익을 기록했다. 용량 제약이 클수록 팩터 기반 접근의 우위가 확대된다.",
    originalUrl: "https://doi.org/10.1093/rof/rfad045",
  },
  {
    id: "am-eq-002",
    title:
      "Global Equity Indexing vs. Active Management for Pension Assets",
    titleKo: "연기금 자산의 글로벌 주식: 지수 vs 액티브 운용",
    authors: ["John C. Bogle Institute", "CalPERS Investment Office"],
    year: 2025,
    journal: "Pension Research Council Working Paper",
    category: "asset-management",
    subCategory: "equity",
    abstract:
      "This study compares total cost of ownership between passive indexing and active equity management for pension funds exceeding $100B AUM. We conclude that a core-satellite approach with 70% passive core optimizes the cost-alpha tradeoff.",
    abstractKo:
      "AUM 1000억 달러 이상 연기금의 패시브 지수 추종과 액티브 주식 운용 간 총 소유 비용을 비교한다. 70% 패시브 코어를 갖춘 코어-위성(core-satellite) 접근이 비용-알파 트레이드오프를 최적화한다.",
    summaryKo:
      "초대형 연기금은 완전 액티브 또는 완전 패시브보다 코어-위성 구조가 효율적이다. 70% 패시브 코어 + 30% 액티브 위성(팩터·ESG·신흥국 특화) 구조가 CalPERS·OTPP 데이터에서 최적 비용-수익 균형을 보였다. 관리보수·거래비용·시장충격비용을 포함한 TCO 분석이 핵심이다.",
    originalUrl: "https://doi.org/10.2139/ssrn.5123456",
    pdfUrl: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5123456",
  },
  {
    id: "am-bd-001",
    title:
      "Liability-Driven Investment in Low-Yield Bond Markets",
    titleKo: "저금리 채권 시장에서의 부채연동투자(LDI)",
    authors: ["Michael Peskin", "BlackRock Solutions"],
    year: 2024,
    journal: "Journal of Fixed Income",
    category: "asset-management",
    subCategory: "bond",
    abstract:
      "LDI strategies for pension funds must adapt to inverted yield curves and credit spread compression. We present a revised immunization framework using derivatives overlays and credit-sensitive instruments to maintain hedge ratios above 95%.",
    abstractKo:
      "연기금 LDI 전략은 역전된 수익률 곡선과 신용 스프레드 축소에 적응해야 한다. 파생상품 오버레이와 신용민감형 instruments를 활용한 개정 면역화 프레임워크를 제시하여 95% 이상의 헤지 비율을 유지한다.",
    summaryKo:
      "저금리·역전 수익률 곡선 환경에서 전통적 듀레이션 매칭만으로는 부채 헤지가 불충분하다. IRS·스왑션·CDS를 활용한 derivatives overlay와 TIPS·ILB 확대가 핵심 대응책이다. 영국·미국 연기금 사례에서 개정 LDI 프레임워크가 펀딩 비율 변동성을 30% 이상 감소시켰다.",
    originalUrl: "https://doi.org/10.3905/jfi.2024.1.089",
  },
  {
    id: "am-bd-002",
    title:
      "Credit Risk Management in Pension Fixed Income Portfolios",
    titleKo: "연기금 채권 포트폴리오의 신용리스크 관리",
    authors: ["PIMCO", "Ontario Teachers' Pension Plan"],
    year: 2025,
    journal: "Financial Management",
    category: "asset-management",
    subCategory: "bond",
    abstract:
      "We analyze credit allocation decisions in pension bond portfolios post-GFC, finding that high-yield and emerging market debt provide diversification benefits but require dynamic spread monitoring and sector concentration limits.",
    abstractKo:
      "GFC 이후 연기금 채권 포트폴리오의 신용 배분 결정을 분석한다. 하이일드 및 신흥국 채권이 분산효과를 제공하나, 동적 스프레드 모니터링과 섹터 집중도 한도가 필요하다.",
    summaryKo:
      "연기금 채권 포트폴리오에서 IG 중심에서 HY·EMD로의 점진적 확대가 수익률 제고에 기여하나, 신용 사이클 관리가 필수이다. OTPP·PGGM 사례에서 섹터별 5% 한도와 스프레드 기반 동적 배분 규칙이 tail risk를 효과적으로 통제했다.",
    originalUrl: "https://doi.org/10.1111/fima.2025.0034",
  },
  {
    id: "am-alt-001",
    title:
      "Private Equity Allocation in Global Pension Funds: Sizing and Timing",
    titleKo: "글로벌 연기금의 사모펀드 배분: 규모와 타이밍",
    authors: ["Preqin", "Harvard Management Company"],
    year: 2024,
    journal: "Journal of Alternative Investments",
    category: "asset-management",
    subCategory: "alternative",
    abstract:
      "Using data from 200+ global pension funds, we document optimal private equity allocation ranges of 12-18% of total portfolio and show that vintage year diversification reduces J-curve drag by 40%.",
    abstractKo:
      "200개 이상 글로벌 연기금 데이터를 활용하여 최적 PE 배분 범위 12~18%를 도출하고, 빈티지 연도 분산이 J-curve 드래그를 40% 감소시킴을 보인다.",
    summaryKo:
      "대형 연기금의 PE 배분은 12~18% 구간에서 위험-수익 최적점을 형성한다. 빈티지 연도 분산과 co-investment 확대가 J-curve 완화의 핵심이다. 캘리스트·OTPP·Abu Dhabi Pension Fund 사례에서 3~5년 분산 커밋먼트 전략이 DPI(Distributed to Paid-In) 개선에 효과적이었다.",
    originalUrl: "https://doi.org/10.3905/jai.2024.27.2.012",
  },
  {
    id: "am-alt-002",
    title:
      "Infrastructure and Real Assets in Pension Portfolio Construction",
    titleKo: "연기금 포트폴리오 구성에서의 인프라·실물자산",
    authors: ["IFSWF", "AustralianSuper"],
    year: 2025,
    journal: "Real Estate Economics",
    category: "asset-management",
    subCategory: "alternative",
    abstract:
      "Infrastructure and real assets provide inflation-linked cash flows critical for pension liability matching. Our analysis of 50 sovereign wealth and pension funds shows 8-15% allocation to direct infrastructure yields superior risk-adjusted returns.",
    abstractKo:
      "인프라와 실물자산은 연기금 부채 매칭에 필수적인 인플레이션 연동 현금흐름을 제공한다. 50개 SWF·연기금 분석 결과, 직접 인프라 8~15% 배분이 우수한 위험조정 수익을 달성한다.",
    summaryKo:
      "인프라·실물자산은 인플레이션 헤지와 장기 현금흐름 확보에 이상적이다. AustralianSuper·CPPIB·GIC의 직접 투자 사례에서 코어 인프라(8~12%) + value-add(3~5%) 구조가 안정적 인컴과 자본이득을 동시에 제공했다. 유동성 프리미엄과 ESG 인프라 투자 확대가 2025년 주요 트렌드이다.",
    originalUrl: "https://doi.org/10.1111/1540-6229.12456",
  },
  {
    id: "am-alt-003",
    title:
      "Hedge Fund Strategies in Pension Alternative Allocations",
    titleKo: "연기금 대체투자 배분에서의 헤지펀드 전략",
    authors: ["CAIA Association", "CalSTRS"],
    year: 2024,
    journal: "Journal of Portfolio Management",
    category: "asset-management",
    subCategory: "alternative",
    abstract:
      "Pension funds are reducing traditional long-short equity hedge fund allocations in favor of systematic macro and relative value strategies. Fee compression and transparency requirements are reshaping manager selection criteria.",
    abstractKo:
      "연기금은 전통적 롱숏 주식 헤지펀드 배분을 줄이고 체계적 매크로·상대가치 전략으로 전환하고 있다. 수수료 압축과 투명성 요구가 매니저 선정 기준을 재편하고 있다.",
    summaryKo:
      "연기금의 헤지펀드 배분은 5~8% 수준으로 축소·재편 중이다. 롱숏 에쿼티에서 시스템atic macro·RV·크레딧 전략으로 이동하며, 1+10 수수료 구조 대신 투명한 팩터 노출과 낮은 fees를 요구한다. CalSTRS·NYSCRF의 2024년 리밸런싱이 대표적 사례이다.",
    originalUrl: "https://doi.org/10.3905/jpm.2024.50.6.045",
  },
  {
    id: "rm-001",
    title:
      "Integrated Risk Management Framework for Public Pension Systems",
    titleKo: "공적 연기금 시스템의 통합 리스크관리 프레임워크",
    authors: ["Society of Actuaries", "Milliman"],
    year: 2024,
    journal: "North American Actuarial Journal",
    category: "risk-management",
    abstract:
      "We develop an enterprise risk management (ERM) framework integrating investment, liability, and operational risks for public pension systems. Stress testing under 5 macro scenarios reveals funding ratio vulnerabilities in 30% of US state systems.",
    abstractKo:
      "공적 연기금 시스템의 투자·부채·운영 리스크를 통합하는 ERM 프레임워크를 개발한다. 5가지 거시 시나리오 스트레스 테스트 결과, 미국 주 연기금 30%에서 펀딩 비율 취약성이 확인된다.",
    summaryKo:
      "연기금 ERM은 투자리스크·부채리스크·운영리스크·유동성리스크를 통합 관리해야 한다. SOA-Milliman 프레임워크는 5개 거시 시나리오(스태그플레이션·긴축·금리 급등·주가 폭락·장수 리스크) 하에서 펀딩 비율 시뮬레이션을 제공한다. 미국 주 연기금 30%가 2030년까지 70% 미만 펀딩 비율 위험에 노출되어 있다.",
    originalUrl: "https://doi.org/10.1080/10920277.2024.001234",
  },
  {
    id: "rm-002",
    title:
      "Climate Risk Disclosure and Portfolio Resilience in Pension Funds",
    titleKo: "연기금의 기후리스크 공시와 포트폴리오 회복력",
    authors: ["TCFD", "Net Zero Asset Owner Alliance"],
    year: 2025,
    journal: "Journal of Sustainable Finance & Investment",
    category: "risk-management",
    abstract:
      "Climate transition and physical risks pose material threats to pension fund portfolios. We evaluate TCFD-aligned disclosure practices across 80 global pension funds and propose a climate VaR methodology for portfolio-level stress testing.",
    abstractKo:
      "기후 전환·물리적 리스크는 연기금 포트폴리오에 실질적 위협을 가한다. 80개 글로벌 연기금의 TCFD 정렬 공시 관행을 평가하고, 포트폴리오 수준 스트레스 테스트를 위한 기후 VaR 방법론을 제안한다.",
    summaryKo:
      "기후리스크는 연기금의 장기 부채 매칭 능력을 위협하는 핵심 리스크 요인이다. NZAOA 80개 기관 분석에서 TCFD 정렬 공시는 60% 수준이나, 실질적 포트폴리오 조정은 30%에 그친다. Climate VaR과 NGFS 시나리오 기반 스트레스 테스트가 실무 표준으로 자리잡고 있다.",
    originalUrl: "https://doi.org/10.1080/20430795.2025.001567",
  },
  {
    id: "rm-003",
    title:
      "Liquidity Risk Management in Defined Benefit Pension Plans",
    titleKo: "확정급여형(DB) 연기금의 유동성 리스크 관리",
    authors: ["Bank of England", "UK Pension Protection Fund"],
    year: 2024,
    journal: "Journal of Risk Management in Financial Institutions",
    category: "risk-management",
    abstract:
      "The 2022 LDI crisis highlighted liquidity vulnerabilities in UK pension funds. We propose a liquidity coverage ratio (LCR) framework adapted for DB plans with illiquid alternative allocations up to 40%.",
    abstractKo:
      "2022년 LDI 위기는 영국 연기금의 유동성 취약성을 부각시켰다. 대체투자 40%까지 포함하는 DB형 연기금에 적용 가능한 LCR 프레임워크를 제안한다.",
    summaryKo:
      "2022년 영국 LDI 위기 이후 유동성 관리가 연기금 리스크관리의 최우선 과제가 되었다. BoE-PPF 연구는 DB 연기금용 LCR(유동성 커버리지 비율)을 제안하며, illiquid alts 40% 포트폴리오에서도 30일 스트레스 기간 내 margin call 충족을 목표로 한다. collateral management와 derivatives exposure 한도가 핵심 통제 수단이다.",
    originalUrl: "https://doi.org/10.6955/JRMFI.2024.0012",
  },
  {
    id: "pe-001",
    title:
      "Performance Attribution for Multi-Asset Pension Portfolios",
    titleKo: "멀티에셋 연기금 포트폴리오의 성과 기인분석",
    authors: ["CFA Institute", "APG Asset Management"],
    year: 2024,
    journal: "Journal of Performance Measurement",
    category: "performance-evaluation",
    abstract:
      "Traditional Brinson attribution fails for pension portfolios with derivatives, alternatives, and liability overlays. We extend the Brinson-Fachler framework to handle LDI structures and present case studies from Dutch and Canadian pension funds.",
    abstractKo:
      "전통적 Brinson 기인분석은 파생상품·대체투자·부채 오버레이를 포함한 연기금 포트폴리오에 부적합하다. LDI 구조를 처리하도록 Brinson-Fachler 프레임워크를 확장하고, 네덜란드·캐나다 연기금 사례를 제시한다.",
    summaryKo:
      "연기금 성과평가는 단순 Brinson 기인분석으로는 불충분하다. LDI·derivatives overlay·illiquid alts를 포함하는 확장 Brinson-Fachler 모델이 필요하다. APG·CPPIB 사례에서 자산배분 효과(60%)·종목선택(25%)·상호작용(15%) 분해가 실무에 적용되고 있다.",
    originalUrl: "https://doi.org/10.3905/jpm.2024.50.3.078",
  },
  {
    id: "pe-002",
    title:
      "Benchmark Design and Manager Evaluation for Pension Assets",
    titleKo: "연기금 자산의 벤치마크 설계와 운용사 평가",
    authors: ["Russell Investments", "Japan GPIF"],
    year: 2025,
    journal: "Financial Analysts Journal",
    category: "performance-evaluation",
    abstract:
      "Custom benchmark construction for pension funds must reflect liability characteristics and investment policy constraints. We survey 100 global pension funds and propose a liability-aware benchmark methodology.",
    abstractKo:
      "연기금 맞춤 벤치마크는 부채 특성과 투자정책 제약을 반영해야 한다. 100개 글로벌 연기금을 조사하고, 부채 인식(liability-aware) 벤치마크 방법론을 제안한다.",
    summaryKo:
      "연기금 벤치마크는 시장지수 단순 추종이 아닌 부채 인식형 설계가 필요하다. GPIF·CalPERS·NZ Super 등 100개 기관 조사 결과, 65%가 커스텀 복합 벤치마크를 사용하며 부채 듀레이션·인플레이션 연동·ESG 제약을 반영한다. 운용사 평가는 3년 rolling IR과 downside capture ratio를 병행한다.",
    originalUrl: "https://doi.org/10.1080/0015198X.2025.0023456",
  },
  {
    id: "pe-003",
    title:
      "Peer Group Analysis and Relative Performance in Global Pension Industry",
    titleKo: "글로벌 연기금 업계의 피어 그룹 분석과 상대 성과",
    authors: ["Thinking Ahead Institute", "Willis Towers Watson"],
    year: 2024,
    journal: "Pensions & Investments Research",
    category: "performance-evaluation",
    abstract:
      "Peer group benchmarking among global pension funds requires normalization for size, liability profile, and governance structure. Our adjusted peer ranking methodology reveals significant performance dispersion masked by raw return comparisons.",
    abstractKo:
      "글로벌 연기금 간 피어 그룹 벤치마킹은 규모·부채 프로필·거버넌스 구조의 정규화가 필요하다. 조정 피어 랭킹 방법론은 단순 수익률 비교로 가려진 유의미한 성과 분산을 드러낸다.",
    summaryKo:
      "연기금 성과 비교 시 규모·부채구조·거버넌스 차이를 정규화하지 않으면 왜곡된 결과가 나온다. Thinking Ahead Institute의 조정 피어 랭킹은 20년 CAGR 기준 상위 quartile과 하위 quartile 간 300bp 이상 격차를 보인다. 투명성·비용 효율성·내부화 수준이 성과 분산의 주요 설명 변수이다.",
    originalUrl: "https://doi.org/10.2139/ssrn.4987654",
    pdfUrl: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4987654",
  },
  {
    id: "pa-003",
    title:
      "Glide Path Design for Target Date Funds in Public Pension Systems",
    titleKo: "공적 연기금 TDF의 글라이드 패스 설계",
    authors: ["Vanguard", "CalSTRS"],
    year: 2025,
    journal: "Journal of Retirement",
    category: "asset-allocation",
    subCategory: "strategy-general",
    abstract:
      "Target date fund glide paths for public sector pension systems must balance de-risking speed with longevity risk. We compare linear, front-loaded, and back-loaded glide paths using Monte Carlo simulation over 40-year horizons.",
    abstractKo:
      "공공부문 연기금 TDF 글라이드 패스는 디리스킹 속도와 장수 리스크 간 균형이 필요하다. 40년 몬테카를로 시뮬레이션으로 선형·전방·후방 로드 글라이드 패스를 비교한다.",
    summaryKo:
      "공적 연기금 TDF의 글라이드 패스 설계는 퇴직 시점 디리스킹과 장수 리스크 간 trade-off가 핵심이다. CalSTRS 사례 분석에서 후방 로드(back-loaded) 글라이드가 40년 horizon에서 펀딩 비율 안정성과 수익률을 동시에 개선했다. 2050년 목표 TDF의 equity exposure 55~65%가 최적 구간으로 도출되었다.",
    originalUrl: "https://doi.org/10.3905/jor.2025.0012",
  },
];

export function getPapersByCategory(
  category: Paper["category"] | "all",
  subCategory?: Paper["subCategory"] | "all"
): Paper[] {
  return papers.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (
      (category === "asset-management" || category === "asset-allocation") &&
      subCategory &&
      subCategory !== "all" &&
      p.subCategory !== subCategory
    )
      return false;
    return true;
  });
}

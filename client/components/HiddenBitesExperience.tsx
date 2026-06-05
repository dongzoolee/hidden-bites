"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchHbScores, fetchRestaurantReport, fetchRestaurants, fetchSummary } from "@/lib/api";
import type { HbFactor, HbScorePoint, RestaurantReport, RestaurantSummary, SummaryPayload } from "@/lib/api-types";
import type { RestaurantSelectionOptions } from "@/lib/selection-types";
import { QnaAccordion, type QnaAccordionItem } from "@/components/QnaAccordion";
import { ScorePlot } from "@/components/ScorePlot";
import { RestaurantReportPanel } from "@/components/RestaurantReportPanel";
import { SeoulRestaurantMap } from "@/components/SeoulRestaurantMap";

interface ExperienceData {
  summary: SummaryPayload;
  factors: HbFactor[];
  points: HbScorePoint[];
  restaurants: RestaurantSummary[];
}

const navigationItems = [
  { label: "00 INTRO", href: "#intro" },
  { label: "01 Preview", href: "#question" },
  { label: "02 Q&A", href: "#data-source" },
  { label: "03 HB SCORE", href: "#scores" },
  { label: "04 Emotion Mapping", href: "#report" },
  { label: "05 REMAPping", href: "#map" },
  { label: "06 Limitation", href: "#limitations" }
];

const reportSectionId = "report";

const heroDescription = "Google's top-50 restaurants in Seoul, re-scored by the factors people actually mention in their reviews.";

const previewFactors = [
  { label: "Taste", weight: 70 },
  { label: "Service", weight: 40 },
  { label: "Value", weight: 50 },
  { label: "Atmosphere", weight: 90 },
  { label: "Accessibility", weight: 50 },
  { label: "Wait/queue", weight: 30 }
];

const previewChartDots = [
  { x: 42, y: 64, radius: 3 },
  { x: 47, y: 58, radius: 4 },
  { x: 51, y: 46, radius: 3 },
  { x: 55, y: 52, radius: 4 },
  { x: 59, y: 39, radius: 3 },
  { x: 62, y: 68, radius: 3 },
  { x: 66, y: 56, radius: 4 },
  { x: 69, y: 47, radius: 3 },
  { x: 72, y: 33, radius: 3 },
  { x: 75, y: 24, radius: 5 },
  { x: 78, y: 41, radius: 3 },
  { x: 81, y: 37, radius: 4 },
  { x: 84, y: 50, radius: 3 },
  { x: 88, y: 44, radius: 3 }
];

const previewMapDots = [
  { x: 24, y: 54 },
  { x: 28, y: 57 },
  { x: 32, y: 51 },
  { x: 58, y: 43 },
  { x: 61, y: 48 },
  { x: 64, y: 39 },
  { x: 70, y: 45 },
  { x: 78, y: 64 },
  { x: 82, y: 60 },
  { x: 86, y: 67 }
];

const limitationCards = [
  {
    number: "01",
    title: "Coverage",
    body: "We analyzed top-50, high-review Seoul restaurants, not a full census of every local place.",
    tone: "yellow"
  },
  {
    number: "02",
    title: "Sampling bias",
    body: "Google Maps reviewers are not a neutral sample. Tourist-heavy locations are overrepresented.",
    tone: "pink"
  },
  {
    number: "03",
    title: "Rating inflation",
    body: "Review volume favors famous places and already visible neighborhoods.",
    tone: "cream"
  },
  {
    number: "04",
    title: "NLP accuracy",
    body: "Adjective and keyword extraction can miss slang, sarcasm, multilingual reviews, and context.",
    tone: "green"
  },
  {
    number: "05",
    title: "Time sensitivity",
    body: "Restaurant quality changes over time. A five-year review window still contains old signals.",
    tone: "black"
  }
];

export function HiddenBitesExperience() {
  const [data, setData] = useState<ExperienceData | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [report, setReport] = useState<RestaurantReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialData(): Promise<void> {
      try {
        const [summary, scores, restaurants] = await Promise.all([fetchSummary(), fetchHbScores(), fetchRestaurants()]);
        const queryPlaceId = new URLSearchParams(window.location.search).get("place");
        const fallbackPlaceId = restaurants[0]?.placeId ?? null;
        const nextPlaceId = restaurants.some((restaurant) => restaurant.placeId === queryPlaceId) ? queryPlaceId : fallbackPlaceId;

        if (active) {
          setData({
            summary,
            factors: scores.factors,
            points: scores.points,
            restaurants
          });
          setSelectedPlaceId(nextPlaceId);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load Hidden Bites data");
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPlaceId) {
      return;
    }

    let active = true;
    const placeId = selectedPlaceId;

    async function loadReport(): Promise<void> {
      try {
        const nextReport = await fetchRestaurantReport(placeId);

        if (active) {
          setReport(nextReport);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load restaurant report");
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [selectedPlaceId]);

  const selectedRestaurant = useMemo(() => {
    if (!data || !selectedPlaceId) {
      return null;
    }

    return data.restaurants.find((restaurant) => restaurant.placeId === selectedPlaceId) ?? null;
  }, [data, selectedPlaceId]);

  const qnaItems = useMemo<QnaAccordionItem[]>(buildQnaItems, []);

  const handleSelectRestaurant = useCallback((placeId: string, options: RestaurantSelectionOptions = {}) => {
    setSelectedPlaceId(placeId);
    setReport(null);

    const url = new URL(window.location.href);
    url.searchParams.set("place", placeId);
    const nextHash = options.targetHash ? `#${options.targetHash}` : url.hash;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${nextHash}`);

    if (options.scrollToReport) {
      window.requestAnimationFrame(() => {
        document.getElementById(reportSectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  if (errorMessage) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="error-state">
          <p className="eyebrow">Hidden Bites</p>
          <h1>Data failed to load.</h1>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="loading-state">
          <Loader2 aria-hidden="true" className="loading-state__icon" size={28} />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell figma-story">
      <section className="story-section story-section--hero" id="intro">
        <nav className="story-nav" aria-label="Story sections">
          <a className="story-brand" href="#intro">Hidden Bites.</a>
          <div className="story-nav__links">
            {navigationItems.map((item, index) => (
              <a className={index === 0 ? "nav-pill nav-pill--active" : "nav-pill"} href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>
        <div className="hero-poster">
          <p className="micro-label">
            <strong>Data visualization project</strong>
            <span>Sogang University Art&Technology</span>
          </p>
          <h1 aria-label={data.summary.title}>
            <span>Hidden</span>
            <span>Bites.</span>
          </h1>
          <p>{heroDescription}</p>
          <div className="hero-metrics" aria-label="Hidden Bites metrics">
            <span>{data.summary.metadata.restaurantCount} restaurants</span>
            <span>5-yr review window</span>
            <span>NLP adjectives + keywords</span>
          </div>
          <div className="hero-dots" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <section className="story-section story-section--question" id="question">
        <div className="question-card">
          <p className="micro-label">The question</p>
          <h2>What are the real factors behind a great 맛집?</h2>
          <p>
            Top star points and most reviews become the entry point. The story then asks whether reviews reveal different
            reasons for being a matjip: taste, service, value, atmosphere, accessibility, and waiting friction.
          </p>
          <div className="preview-collage" aria-label="Hidden Bites preview collage">
            <article className="preview-report-card" aria-label="Mutan COEX Store preview">
              <div className="preview-report-card__header">
                <span>Individual evaluation</span>
                <strong>Mutan COEX Store</strong>
                <em>Rank #1 of 50 · Google baseline 4.7★</em>
              </div>
              <b>4.93★</b>
              <div className="preview-factor-grid">
                {previewFactors.map((factor) => (
                  <div className="preview-factor" key={factor.label}>
                    <span>{factor.label}</span>
                    <i style={{ width: `${factor.weight}%` }} />
                  </div>
                ))}
              </div>
              <div className="preview-report-card__cta">Go to Report</div>
            </article>
            <div className="preview-score-badge">
              <span>Jongno Naengmyeon</span>
              <strong>74.0</strong>
            </div>
            <article className="preview-chart-card" aria-label="HB score graph preview">
              <div className="preview-card-toolbar">
                <span>Scatter</span>
                <span>Ranked list</span>
                <strong>X: Taste</strong>
              </div>
              <h3>HB Score graph</h3>
              <svg aria-hidden="true" viewBox="0 0 100 80">
                <line x1="10" x2="10" y1="10" y2="68" />
                <line x1="10" x2="94" y1="68" y2="68" />
                <line x1="10" x2="94" y1="20" y2="20" />
                <line x1="10" x2="94" y1="44" y2="44" />
                {previewChartDots.map((dot) => (
                  <circle cx={dot.x} cy={dot.y} key={`${dot.x}-${dot.y}`} r={dot.radius} />
                ))}
                <circle className="preview-chart-card__selected-dot" cx="75" cy="24" r="5.4" />
              </svg>
            </article>
            <article className="preview-controls-card" aria-label="Score controls preview">
              <h3>Score controls</h3>
              <div className="preview-control-chip-grid">
                {previewFactors.map((factor, index) => (
                  <span className={index === 0 ? "preview-control-chip preview-control-chip--active" : "preview-control-chip"} key={factor.label}>
                    {factor.label}
                  </span>
                ))}
              </div>
              <div className="preview-control-sliders">
                {previewFactors.map((factor) => (
                  <span key={factor.label}>
                    <b>{factor.label}</b>
                    <i>
                      <em style={{ width: `${factor.weight}%` }} />
                    </i>
                  </span>
                ))}
              </div>
            </article>
            <article className="preview-map-card" aria-label="Seoul dot map preview">
              <svg aria-hidden="true" viewBox="0 0 100 72">
                <ellipse cx="52" cy="36" rx="42" ry="28" />
                <path d="M8 41H92" />
                {previewMapDots.map((dot) => (
                  <circle cx={dot.x} cy={dot.y} key={`${dot.x}-${dot.y}`} r="2.6" />
                ))}
              </svg>
            </article>
          </div>
        </div>
      </section>

      <section className="story-section story-section--qna" id="data-source">
        <div className="section-kicker">5 - 1 · Q&A</div>
        <div className="split-heading">
          <h2>
            Why this
            <span>data source?</span>
          </h2>
          <p>Before we re-score, the two doubts that come up first — why Google Maps, and how we narrowed the city down to fifty.</p>
        </div>
        <QnaAccordion items={qnaItems} />
      </section>

      <section className="story-section story-section--scores" id="scores">
        <div className="section-kicker">5 - 2 · HB Scores</div>
        <div className="score-heading">
          <h2>HB Scores: re-scoring Hidden Bites</h2>
          <p>Drag a slider. The chart recalculates Google star points using only the factor weights you care about.</p>
        </div>
        <ScorePlot factors={data.factors} points={data.points} selectedPlaceId={selectedPlaceId} onSelectPlace={handleSelectRestaurant} />
      </section>

      <section className="story-section story-section--report" id="report">
        <div className="section-kicker">5 - 3 · Report on the selected restaurant</div>
        <div className="selected-heading">
          <h2>Selected:</h2>
          <label className="selected-heading__control" htmlFor="selected-report-restaurant-select">
            <span className="sr-only">Selected restaurant</span>
            <select
              className="selected-heading__select restaurant-select"
              id="selected-report-restaurant-select"
              value={selectedRestaurant?.placeId ?? selectedPlaceId ?? ""}
              onChange={(event) => handleSelectRestaurant(event.target.value)}
            >
              {data.restaurants.map((restaurant) => (
                <option key={restaurant.placeId} value={restaurant.placeId}>
                  {restaurant.displayPlaceName}
                </option>
              ))}
            </select>
          </label>
          <p>The report links macro emotional adjective patterns with micro keyword evidence from original reviews.</p>
        </div>
        {report ? (
          <RestaurantReportPanel report={report} restaurants={data.restaurants} onSelectPlace={handleSelectRestaurant} />
        ) : (
          <div className="report-loading">Loading report...</div>
        )}
      </section>

      <section className="story-section story-section--map" id="map">
        <div className="section-kicker">5 - 4 · Where are they located</div>
        <div className="map-heading">
          <h2>
            The top-50 dots are not spread evenly across <span>Seoul.</span>
          </h2>
          <p>Most high-review, high-rating restaurants cluster around tourism, shopping, office, and nightlife places.</p>
        </div>
        <SeoulRestaurantMap restaurants={data.restaurants} selectedPlaceId={selectedPlaceId} onSelectPlace={handleSelectRestaurant} />
      </section>

      <section className="story-section story-section--limitations" id="limitations">
        <div className="section-kicker">5 - 5 · Limitations</div>
        <h2>
          What this story <span>cannot claim yet.</span>
        </h2>
        <p>Five honest disclaimers. Every visualization above sits inside the boundaries described below.</p>
        <div className="limitation-grid">
          {limitationCards.map((card) => (
            <article className={`limitation-card limitation-card--${card.tone}`} key={card.number}>
              <span>{card.number}</span>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="story-footer">
        <h2>
          <span>Hidden</span>
          <span>Bites.</span>
        </h2>
        <div className="footer-meta">
          <div>
            <strong>The team</strong>
            <span>{data.summary.members.join(" · ")}</span>
          </div>
          <div>
            <strong>The class</strong>
            <span>{data.summary.className}</span>
            <span>advised by {data.summary.advisor}</span>
          </div>
          <div>
            <strong>The story</strong>
            <span>web-desktop edition · 2026.05</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function buildQnaItems(): QnaAccordionItem[] {
  return [
    {
      question: "Why we chose Google Maps — not Naver or Kakao.",
      answer: "Three Korean review platforms, three trade-offs. We compared review counts, the presence of star ratings, and how heavily each one skews toward promotional content.",
      tone: "yellow",
      cards: [
        {
          title: "Google Maps",
          meta: "stars: ✓ · mix: local + tourist",
          body: "별점 + 리뷰 수 + 외국인·현지인이 혼재한 더 중립적인 데이터.",
          tone: "yellow",
          variant: "featured"
        },
        {
          title: "Naver Map",
          meta: "stars: ✕ · ads: high",
          body: "광고성 리뷰 과다. 별점이 없어 정량 비교가 어렵다.",
          tone: "yellow"
        },
        {
          title: "Kakao Map",
          meta: "stars: ✓ · volume: low",
          body: "리뷰 수가 부족해 상위 50개를 안정적으로 추리기 어려웠다.",
          tone: "yellow"
        }
      ]
    },
    {
      question: "How we picked the top 50.",
      answer: "Restaurants were ranked using a weighted sum of two signals over the last five years in Seoul: recency-weighted review volume + star-point strength. The top-50 candidates then enter the recalculation pipeline.",
      tone: "pink",
      formula: {
        label: "Formula",
        expression: "score(r_k) = 0.55 · log(reviews_5y) + 0.45 · stars · sqrt(reviews_30d)"
      }
    },
    {
      question: "What is the HB Score?",
      answer: "Adjective and keyword frequencies are extracted from every review per restaurant. You decide which factors matter, set their weights, and the page re-scores all 50 against your preferences. Move a slider — the leaderboard rearranges.",
      tone: "green"
    }
  ];
}

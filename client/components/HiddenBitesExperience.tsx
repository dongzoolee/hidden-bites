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
  { label: "Go intro", href: "#intro" },
  { label: "01 Preview", href: "#question" },
  { label: "02 Q&A", href: "#data-source" },
  { label: "03 HB Score", href: "#scores" },
  { label: "04 Emotion Mapping", href: "#report" },
  { label: "05 Dot Mapping", href: "#map" },
  { label: "06 Limitations", href: "#limitations" }
];

const reportSectionId = "report";

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

  const qnaItems = useMemo<QnaAccordionItem[]>(() => {
    if (!data) {
      return [];
    }

    return buildQnaItems(data.summary.qna);
  }, [data]);

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
            Data visualization project <span>{data.summary.className}</span>
          </p>
          <h1 aria-label={data.summary.title}>
            <span>Hidden</span>
            <span>Bites.</span>
          </h1>
          <p>{data.summary.description}</p>
          <div className="hero-metrics" aria-label="Hidden Bites metrics">
            <span>{data.summary.metadata.restaurantCount} restaurants</span>
            <span>5-yr review window</span>
            <span>{data.summary.metadata.factorCount} factors</span>
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
          <div className="preview-collage" aria-label="Hidden Bites preview cards">
            <div className="preview-card preview-card--dark">
              <span>COEX Store</span>
              <strong>4.93</strong>
              <div className="preview-lines">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="preview-card preview-card--chart">
              <span>HB Score graph</span>
              <b>{data.summary.metadata.graphPointCount}</b>
            </div>
            <div className="preview-card preview-card--map">
              <span>Seoul dots</span>
              <b>{data.summary.metadata.mapPointCount}</b>
            </div>
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
          <p>Before we re-score anything, the first doubt comes up first: why Google Maps, and how we narrowed the city down to fifty.</p>
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

function buildQnaItems(items: SummaryPayload["qna"]): QnaAccordionItem[] {
  const fallbackItems: SummaryPayload["qna"] = [
    {
      question: "Why we chose Google Maps -- not Naver or Kakao.",
      answer: "Three Korean review platforms, three trade-offs. We compared review counts, star ratings, and how heavily each source moves toward promotional content."
    },
    {
      question: "How we picked the top 50.",
      answer: "Restaurants were sorted by a weighted mix of star quality and review count, then reviewed as a Seoul-only sample."
    },
    {
      question: "What is the HB Score?",
      answer: "HB Score re-weights restaurant reviews by factor-level evidence extracted from review text."
    }
  ];
  const sourceItems = items.length >= 3 ? items : fallbackItems;

  return [
    {
      ...sourceItems[0],
      tone: "yellow",
      cards: [
        { title: "Google Maps", body: "Star ratings, review counts, and a blend of local and international user insights.", tone: "yellow" },
        { title: "Naver Map", body: "High volume of promotional content. Lack of star ratings limits quantitative analysis.", tone: "yellow" },
        { title: "Kakao Map", body: "Insufficient review volume hindered reliable selection of the top 50 list.", tone: "yellow" }
      ]
    },
    {
      ...sourceItems[1],
      tone: "pink",
      cards: [
        { title: "Formula", body: "Score = star rating, review count, five-year review window, and Seoul-only location filter.", tone: "pink" }
      ]
    },
    {
      ...sourceItems[2],
      tone: "green",
      cards: [
        { title: "HB factor", body: "Taste, service, value, atmosphere, accessibility, wait queue, occasion, portion, cleanliness, uniqueness.", tone: "green" }
      ]
    }
  ];
}

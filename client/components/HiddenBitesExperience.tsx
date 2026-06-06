"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
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

interface FooterTeamMember {
  name: string;
  role: string | null;
  email: string;
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
const selectedRestaurantPickerId = "selected-restaurant-picker";
const selectedRestaurantDropdownButtonId = "selected-restaurant-picker-button";

const heroDescription = "Google's top-50 restaurants in Seoul, re-scored by the factors people actually mention in their reviews.";

const limitationCards = [
  {
    number: "01",
    titleLines: ["Coverage"],
    bodyLines: ["We analyzed top-50 only.", "Seoul has thousands of", "restaurants — an entire", "long tail of small, beloved", "places sits outside our", "sample."],
    tone: "yellow"
  },
  {
    number: "02",
    titleLines: ["Sampling bias"],
    bodyLines: ["Google Maps reviewers are", "not a neutral sample.", "Tourist languages are", "overrepresented; Korean", "local voices are under-", "weighted."],
    tone: "pink"
  },
  {
    number: "03",
    titleLines: ["Rating", "inflation"],
    bodyLines: ["Review volume favors", "tourist places already", "getting searched often.", "Novelty effect may inflate", "ratings in dense tourism", "zones."],
    tone: "cream"
  },
  {
    number: "04",
    titleLines: ["NLP accuracy"],
    bodyLines: ["Adjective and keyword", "extraction can miss slang,", "sarcasm, and multilingual", "reviews. Emotion", "classification is model-", "dependent."],
    tone: "green"
  },
  {
    number: "05",
    titleLines: ["Time", "sensitivity"],
    bodyLines: ["Restaurant quality", "changes over time. Our", "dataset reflects a single", "crawl point — chefs leave,", "prices rise, lines move."],
    tone: "black"
  }
];

const footerTeamMembers: FooterTeamMember[] = [
  { name: "dongzoolee", role: "developer", email: "me@leed.at" },
  { name: "Eunhong Kim", role: "designer", email: "its4hong@gmail.com" },
  { name: "Madina", role: null, email: "abc@gmail.com" },
  { name: "Emilia", role: null, email: "abc@gmail.com" }
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

  const handleExploreAnotherRestaurant = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.getElementById(selectedRestaurantPickerId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        document.getElementById(selectedRestaurantDropdownButtonId)?.focus({ preventScroll: true });
      }, 320);
    });
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
            <span aria-label={`${data.summary.metadata.restaurantCount} restaurants`}>
              <strong>{data.summary.metadata.restaurantCount}</strong>
              <span>restaurants</span>
            </span>
            <span aria-label="5-yr review window">
              <strong>5-yr</strong>
              <span>review window</span>
            </span>
            <span aria-label="NLP adjectives + keywords">
              <strong>NLP</strong>
              <span>adjectives + keywords</span>
            </span>
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
          <h2>
            What are the real factors behind a great <span className="question-card__korean">맛집</span>?
          </h2>
          <p>
            Top star points and most reviews become the entry point. The story then asks whether reviews reveal different
            reasons for being a matjip: taste, service, value, atmosphere, accessibility, and waiting friction.
          </p>
          <div className="preview-collage" aria-label="Hidden Bites preview collage from Figma">
            <img
              alt="Preview collage showing the evaluation card, score badge, score graph, score controls, and Seoul dot map"
              className="preview-collage__asset"
              height={727}
              src="/figma/question-preview-collage.png"
              width={2730}
            />
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
          <p>
            <strong>Drag a slider.</strong> The chart recalculates Google&apos;s star points using only the factor weights you care about; the highlighted dot is the
            top pick under your current preference.
          </p>
        </div>
        <ScorePlot factors={data.factors} points={data.points} selectedPlaceId={selectedPlaceId} onSelectPlace={handleSelectRestaurant} />
      </section>

      <section className="story-section story-section--report" id="report">
        <div className="section-kicker">5 - 3 · Report on the selected restaurant</div>
        <div className="selected-heading" id={selectedRestaurantPickerId}>
          <h2>Selected:</h2>
          <SelectedRestaurantDropdown restaurants={data.restaurants} selectedPlaceId={selectedRestaurant?.placeId ?? selectedPlaceId ?? ""} onSelectPlace={handleSelectRestaurant} />
          <p>The report links macro emotional adjective patterns with micro keyword evidence from original reviews.</p>
          <p>Selecting another dot in HB Scores would refresh this panel.</p>
        </div>
        {report ? (
          <RestaurantReportPanel report={report} onExploreAnotherRestaurant={handleExploreAnotherRestaurant} />
        ) : (
          <div className="report-loading">Loading report...</div>
        )}
      </section>

      <section className="story-section story-section--map" id="map">
        <div className="section-kicker">5 — 4 · WHERE ARE THEY LOCATED</div>
        <div className="map-heading">
          <h2 aria-label="THE TOP-50 DOTS ACROSS SEOUL.">
            THE <span className="map-heading__accent">TOP-50 DOTS</span>
            <br />
            ACROSS SEOUL.
          </h2>
          <p>
            Most high-review, high-rating restaurants cluster around tourism, shopping, office, and nightlife places:
            Myeongdong/Euljiro, Hongdae, Gangnam/COEX, Seongsu, Itaewon, and Daehakro.
          </p>
        </div>
        <SeoulRestaurantMap restaurants={data.restaurants} selectedPlaceId={selectedPlaceId} onSelectPlace={handleSelectRestaurant} />
      </section>

      <section className="story-section story-section--limitations" id="limitations">
        <div className="section-kicker">5 - 5 · Limitations</div>
        <h2>
          What this story <span>cannot claim yet.</span>
        </h2>
        <p className="limitations-copy">
          <span>Five honest disclaimers.</span>
          <span>Every visualization above sits inside the boundaries described below.</span>
        </p>
        <div className="limitation-grid">
          {limitationCards.map((card) => (
            <article className={`limitation-card limitation-card--${card.tone}`} key={card.number}>
              <span className="limitation-card__number">{card.number}</span>
              <strong className="limitation-card__title">
                {card.titleLines.map((line) => (
                  <span className="limitation-card__title-line" key={line}>
                    {line}
                  </span>
                ))}
              </strong>
              <p className="limitation-card__body">
                {card.bodyLines.map((line) => (
                  <span className="limitation-card__body-line" key={line}>
                    {line}
                  </span>
                ))}
              </p>
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
            <div className="footer-team-grid">
              {footerTeamMembers.map((member) => (
                <span className="footer-team-member" key={member.name}>
                  <span className="footer-team-name">
                    {member.name}
                    {member.role ? <span className="footer-team-role"> ({member.role})</span> : null}
                  </span>
                  <span className="footer-team-email">{member.email}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <strong>The class</strong>
            <div className="footer-copy">
              <span>26-1 Data Visualization</span>
              <span>Sogang University · Art & Technology</span>
              <span>advised by Prof. JeeWon Kim</span>
            </div>
          </div>
          <div>
            <strong>The story</strong>
            <div className="footer-copy footer-copy--mono">
              <span>web-desktop edition · 2026.05 · vol.01</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

interface SelectedRestaurantDropdownProps {
  restaurants: RestaurantSummary[];
  selectedPlaceId: string;
  onSelectPlace: (placeId: string) => void;
}

function SelectedRestaurantDropdown({ restaurants, selectedPlaceId, onSelectPlace }: SelectedRestaurantDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    restaurants.findIndex((restaurant) => restaurant.placeId === selectedPlaceId)
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedRestaurant = restaurants[selectedIndex] ?? restaurants[0] ?? null;
  const listboxId = "selected-restaurant-listbox";
  const activeOptionId = isOpen ? `selected-restaurant-option-${activeIndex}` : undefined;

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  function handleSelect(placeId: string): void {
    onSelectPlace(placeId);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (restaurants.length === 0) {
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (currentIndex + direction + restaurants.length) % restaurants.length;
      });
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      const activeRestaurant = restaurants[activeIndex];

      if (activeRestaurant) {
        handleSelect(activeRestaurant.placeId);
      }
    }
  }

  return (
    <div
      className="selected-restaurant-dropdown"
      onBlur={(event) => {
        const nextFocusTarget = event.relatedTarget;

        if (!(nextFocusTarget instanceof Node) || !event.currentTarget.contains(nextFocusTarget)) {
          setIsOpen(false);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <button
        aria-activedescendant={activeOptionId}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="selected-restaurant-dropdown__button"
        id={selectedRestaurantDropdownButtonId}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedRestaurant?.displayPlaceName ?? "Restaurant"}</span>
      </button>
      {isOpen ? (
        <div className="selected-restaurant-dropdown__menu" id={listboxId} role="listbox" aria-label="Selected restaurant">
          {restaurants.map((restaurant, index) => (
            <button
              aria-selected={restaurant.placeId === selectedPlaceId}
              className={index === activeIndex ? "selected-restaurant-dropdown__option selected-restaurant-dropdown__option--active" : "selected-restaurant-dropdown__option"}
              id={`selected-restaurant-option-${index}`}
              key={restaurant.placeId}
              role="option"
              tabIndex={-1}
              type="button"
              onClick={() => handleSelect(restaurant.placeId)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <strong>{restaurant.displayPlaceName}</strong>
              <span>
                #{restaurant.placeRank} · {restaurant.district}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
          body: "Star ratings, review counts, and a blend of local/international user insights",
          bodyLines: ["Star ratings, review counts, and a blend of", "local/international user insights"],
          tone: "yellow",
          variant: "featured"
        },
        {
          title: "Naver Map",
          body: "\"High volume of promotional content. Lack of star ratings limits quantitative analysis.\"",
          bodyLines: ["\"High volume of promotional content. Lack", "of star ratings limits quantitative analysis.\""],
          tone: "yellow"
        },
        {
          title: "Kakao Map",
          body: "\"Insufficient review volume hindered reliable selection of the top 50 list.\"",
          bodyLines: ["\"Insufficient review volume hindered reliable", "selection of the top 50 list.\""],
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
        expression: "score(rₖ) = 0.55 · log(reviews_5y) + 0.45 · stars · √reviews_30d"
      }
    },
    {
      question: "What is the HB Score?",
      answer: "Adjective and keyword frequencies are extracted from every review per restaurant. You decide which factors matter, set their weights, and the page re-scores all 50 against your preferences. Move a slider — the leaderboard rearranges.",
      tone: "green"
    }
  ];
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { fetchHbScores, fetchRestaurantReport, fetchRestaurants, fetchSummary } from "@/lib/api";
import type { HbFactor, HbScorePoint, RestaurantReport, RestaurantSummary, SummaryPayload } from "@/lib/api-types";
import { QnaAccordion } from "@/components/QnaAccordion";
import { ScorePlot } from "@/components/ScorePlot";
import { RestaurantReportPanel } from "@/components/RestaurantReportPanel";

interface ExperienceData {
  summary: SummaryPayload;
  factors: HbFactor[];
  points: HbScorePoint[];
  restaurants: RestaurantSummary[];
}

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

  const handleSelectRestaurant = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
    setReport(null);

    const url = new URL(window.location.href);
    url.searchParams.set("place", placeId);
    window.history.replaceState(null, "", `${url.pathname}${url.search}#report`);
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
          <p>Loading Hidden Bites data story</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="section section--hero" id="intro">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{data.summary.className}</p>
            <h1>{data.summary.title}</h1>
            <p className="hero-question">{data.summary.question}</p>
            <p className="hero-description">{data.summary.description}</p>
            <dl className="meta-list">
              <div>
                <dt>Advisor</dt>
                <dd>{data.summary.advisor}</dd>
              </div>
              <div>
                <dt>Members</dt>
                <dd>{data.summary.members.join(", ")}</dd>
              </div>
            </dl>
          </div>
          <div className="hero-visual" aria-label="Seoul top restaurant dot map preview">
            <img src="/assets/seoul-top-restaurants.png" alt="Seoul top restaurants dot map" />
            <div className="hero-visual__caption">
              <span>{data.summary.metadata.restaurantCount} restaurants</span>
              <span>{data.summary.metadata.graphPointCount} factor dots</span>
            </div>
          </div>
        </div>
        <QnaAccordion items={data.summary.qna} />
      </section>

      <section className="section section--scores" id="scores">
        <div className="section-heading">
          <p className="eyebrow">HB Scores</p>
          <h2>Each dot is a restaurant, measured against one matjip factor.</h2>
          <p>
            Select a dot to move the report. The y-axis keeps the HB score in the original 0.00 to 5.00 range.
          </p>
        </div>
        <ScorePlot
          factors={data.factors}
          points={data.points}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectRestaurant}
        />
      </section>

      <section className="section section--report" id="report">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Selected Restaurant Report</p>
          <h2>{selectedRestaurant?.placeName ?? "Restaurant report"}</h2>
          {selectedRestaurant ? (
            <a className="external-link" href={selectedRestaurant.googleMapsUri} target="_blank" rel="noreferrer">
              Google Maps
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          ) : null}
        </div>
        {report ? <RestaurantReportPanel report={report} /> : <div className="report-loading">Loading report...</div>}
      </section>
    </main>
  );
}

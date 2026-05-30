import { Injectable, NotFoundException } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  HbScoresPayload,
  RestaurantReport,
  RestaurantSummary,
  SummaryPayload,
  WebReportPayload
} from "./hb.types";

@Injectable()
export class HbDataService {
  private readonly payload: WebReportPayload;
  private readonly reportsByPlaceId: Map<string, RestaurantReport>;

  constructor() {
    const dataRoot = resolveDataRoot();
    const dataPath = resolve(dataRoot, "hb-score-web-report.json");
    this.payload = JSON.parse(readFileSync(dataPath, "utf8")) as WebReportPayload;
    this.reportsByPlaceId = new Map(this.payload.reports.map((report) => [report.placeId, report]));
  }

  getHealth(): { ok: true; restaurantCount: number; generatedAt: string } {
    return {
      ok: true,
      restaurantCount: this.payload.restaurants.length,
      generatedAt: this.payload.metadata.generatedAt
    };
  }

  getSummary(): SummaryPayload {
    return {
      ...this.payload.summary,
      metadata: {
        restaurantCount: this.payload.metadata.restaurantCount,
        factorCount: this.payload.metadata.factorCount,
        graphPointCount: this.payload.metadata.graphPointCount,
        reportCount: this.payload.metadata.reportCount
      }
    };
  }

  getHbScores(): HbScoresPayload {
    return {
      factors: this.payload.factors,
      points: this.payload.points
    };
  }

  getRestaurants(): RestaurantSummary[] {
    return this.payload.restaurants;
  }

  getRestaurantReport(placeId: string): RestaurantReport {
    const report = this.reportsByPlaceId.get(placeId);

    if (!report) {
      throw new NotFoundException(`Restaurant report not found: ${placeId}`);
    }

    return report;
  }
}

function resolveDataRoot(): string {
  if (process.env.HIDDEN_BITES_DATA_ROOT) {
    return resolve(process.env.HIDDEN_BITES_DATA_ROOT);
  }

  const cwd = process.cwd();

  if (cwd.endsWith("/server")) {
    return resolve(cwd, "../datasets/derived");
  }

  return resolve(cwd, "datasets/derived");
}

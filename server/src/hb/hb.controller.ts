import { Controller, Get, Param } from "@nestjs/common";
import { HbDataService } from "./hb-data.service";
import type { HbScoresPayload, RestaurantReport, RestaurantSummary, SummaryPayload } from "./hb.types";

@Controller()
export class HbController {
  constructor(private readonly dataService: HbDataService) {}

  @Get("health")
  getHealth(): { ok: true; restaurantCount: number; generatedAt: string } {
    return this.dataService.getHealth();
  }

  @Get("api/summary")
  getSummary(): SummaryPayload {
    return this.dataService.getSummary();
  }

  @Get("api/hb-scores")
  getHbScores(): HbScoresPayload {
    return this.dataService.getHbScores();
  }

  @Get("api/restaurants")
  getRestaurants(): RestaurantSummary[] {
    return this.dataService.getRestaurants();
  }

  @Get("api/restaurants/:placeId/report")
  getRestaurantReport(@Param("placeId") placeId: string): RestaurantReport {
    return this.dataService.getRestaurantReport(placeId);
  }
}

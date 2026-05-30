import { Module } from "@nestjs/common";
import { HbController } from "./hb/hb.controller";
import { HbDataService } from "./hb/hb-data.service";

@Module({
  controllers: [HbController],
  providers: [HbDataService]
})
export class AppModule {}

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { WritersService } from '../writers/writers.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly writersService: WritersService,
  ) {}

  @Get('admin-dashboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminDashboard(@CurrentUser() user: any) {
    return this.analyticsService.getAdminDashboard();
  }

  @Get('orders-per-day')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrdersPerDay(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days) : 30;
    return this.analyticsService.getOrdersPerDayChart(daysNum);
  }

  @Get('earnings-per-writer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getEarningsPerWriter(@CurrentUser() user: any) {
    return this.analyticsService.getEarningsPerWriterChart();
  }

  @Get('pages-per-shift')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPagesPerShift(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days) : 14;
    return this.analyticsService.getPagesPerShiftChart(daysNum);
  }

  @Get('writer/:writerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getWriterAnalytics(
    @Param('writerId') writerId: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getWriterAnalytics(writerId);
  }

  @Get('my-analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMyAnalytics(@CurrentUser() user: any) {
    const writer = await this.writersService.findByUserId(user.id);
    return this.analyticsService.getWriterAnalytics(writer.id);
  }
}
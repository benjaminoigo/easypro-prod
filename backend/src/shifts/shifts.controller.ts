import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('current')
  async getCurrentShift(@CurrentUser() user: any) {
    return this.shiftsService.getCurrentShift();
  }

  @Get('stats')
  async getShiftStats(@CurrentUser() user: any) {
    return this.shiftsService.getShiftStats();
  }

  @Get('my-progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMyShiftProgress(@CurrentUser() user: any) {
    return this.shiftsService.getWriterShiftProgress(user.id);
  }

  @Get('writer-progress/:writerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getWriterProgress(@Param('writerId') writerId: string) {
    return this.shiftsService.getWriterShiftProgressByWriterId(writerId);
  }

  @Get('all-writers-progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllWritersProgress() {
    return this.shiftsService.getAllWritersShiftProgress();
  }

  @Get('history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getShiftHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 30;
    return this.shiftsService.getShiftHistory(limitNum);
  }

  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createNewShift(
    @Body() body: { maxPages?: number },
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.createNewShift(body.maxPages);
  }

  @Put('max-pages')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateMaxPages(
    @Body() body: { maxPages: number },
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.updateShiftMaxPages(body.maxPages);
  }
}
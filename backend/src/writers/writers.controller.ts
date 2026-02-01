import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WritersService } from './writers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { UpdateWriterStatusDto } from './dto/update-writer-status.dto';

@Controller('writers')
@UseGuards(JwtAuthGuard)
export class WritersController {
  constructor(private readonly writersService: WritersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@CurrentUser() user: any) {
    return this.writersService.findAll();
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMyProfile(@CurrentUser() user: any) {
    return this.writersService.findByUserId(user.id);
  }

  @Get('me/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMyAnalytics(@CurrentUser() user: any) {
    const writer = await this.writersService.findByUserId(user.id);
    return this.writersService.getWriterAnalytics(writer.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.writersService.findOne(id);
  }

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnalytics(@Param('id') id: string, @CurrentUser() user: any) {
    return this.writersService.getWriterAnalytics(id);
  }

  @Get(':id/status-history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatusHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.writersService.getStatusHistory(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateWriterStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.writersService.updateStatus(id, updateStatusDto, user.id);
  }
}
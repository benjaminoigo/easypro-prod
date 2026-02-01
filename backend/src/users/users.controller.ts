import {
  Controller,
  Get,
  Param,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll();
  }

  @Get('pending-approvals')
  @Roles(UserRole.ADMIN)
  async getPendingApprovals(@CurrentUser() user: any) {
    return this.usersService.getPendingApprovals();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  async activateUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.activateUser(id);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivateUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.deactivateUser(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id);
  }
}
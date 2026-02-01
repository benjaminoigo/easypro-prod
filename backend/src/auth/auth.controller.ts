import {
  Controller,
  Post,
  Body,
  UseGuards,
  Query,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Query('invite') inviteToken?: string,
  ) {
    return this.authService.register(registerDto, inviteToken);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('invite')
  async generateInvite(@CurrentUser() user: any) {
    return this.authService.generateInviteLink();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('approve/:userId')
  async approveUser(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.authService.approveUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('reject/:userId')
  async rejectUser(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.authService.rejectUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}
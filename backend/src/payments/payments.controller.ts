import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@CurrentUser() user: any) {
    return this.paymentsService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findPending(@CurrentUser() user: any) {
    return this.paymentsService.getPendingPayments();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats(@CurrentUser() user: any) {
    return this.paymentsService.getPaymentStats();
  }

  @Get('my-payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMyPayments(@CurrentUser() user: any) {
    const writerId = user.writerId || user.id; // Adjust as needed
    return this.paymentsService.findByWriter(writerId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id/mark-paid')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async markAsPaid(
    @Param('id') id: string,
    @Body() markPaidDto: MarkPaidDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markAsPaid(id, markPaidDto, user.id);
  }

  @Put(':id/mark-failed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async markAsFailed(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markAsFailed(id, body.reason);
  }
}
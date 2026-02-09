import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
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
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';
import { MarkAllPaidDto } from './dto/mark-all-paid.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto, user?.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query() filter: PaymentFilterDto, @CurrentUser() user: any) {
    return this.paymentsService.findAllWithMeta(filter);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findPending(@Query() filter: PaymentFilterDto, @CurrentUser() user: any) {
    return this.paymentsService.getPendingPayments(filter);
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

  @Put('bulk/mark-paid')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async markSelectedAsPaid(
    @Body() dto: BulkMarkPaidDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markSelectedAsPaid(dto, user.id);
  }

  @Put('mark-all-paid')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async markAllAsPaid(
    @Body() dto: MarkAllPaidDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markAllAsPaid(dto, user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id/mark-failed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async markAsFailed(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markAsFailed(id, body.reason, user.id);
  }
}

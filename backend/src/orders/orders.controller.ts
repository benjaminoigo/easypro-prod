import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { WritersService } from '../writers/writers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly writersService: WritersService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(createOrderDto);
  }

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async registerExternalOrder(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    // Writer registers an external order they picked up
    const writer = await this.writersService.findByUserId(user.id);
    return this.ordersService.create({
      ...createOrderDto,
      writerId: writer.id,
    });
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query('status') status?: string) {
    let options = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      options = { where: { status: status as OrderStatus } };
    }
    return this.ordersService.findAll(options);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats(@CurrentUser() user: any) {
    return this.ordersService.getOrderStats();
  }

  @Get('my-orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMyOrders(@CurrentUser() user: any) {
    const writer = await this.writersService.findByUserId(user.id);
    return this.ordersService.findByWriter(writer.id);
  }

  @Get('order-number/:orderNumber')
  async findByOrderNumber(@Param('orderNumber') orderNumber: string, @CurrentUser() user: any) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Put(':id/assign/:writerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignToWriter(
    @Param('id') id: string,
    @Param('writerId') writerId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.assignToWriter(id, writerId);
  }

  @Put(':id/in-progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async markInProgress(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.markInProgress(id);
  }

  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrder(id, cancelDto, user.id);
  }
}
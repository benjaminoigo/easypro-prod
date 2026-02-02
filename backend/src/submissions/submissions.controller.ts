import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { WritersService } from '../writers/writers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly writersService: WritersService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  async create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    // Get writer by user ID
    const writer = await this.writersService.findByUserId(user.id);
    if (!writer) {
      throw new NotFoundException('Writer profile not found');
    }
    return this.submissionsService.create(createSubmissionDto, writer.id, files);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@CurrentUser() user: any) {
    return this.submissionsService.findAll();
  }

  @Get('pending-reviews')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findPendingReviews(@CurrentUser() user: any) {
    return this.submissionsService.findPendingReviews();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats(@CurrentUser() user: any) {
    return this.submissionsService.getSubmissionStats();
  }

  @Get('my-submissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WRITER)
  async getMySubmissions(@CurrentUser() user: any) {
    const writer = await this.writersService.findByUserId(user.id);
    if (!writer) {
      throw new NotFoundException('Writer profile not found');
    }
    return this.submissionsService.findByWriter(writer.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.submissionsService.findOne(id);
  }

  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reviewSubmission(
    @Param('id') id: string,
    @Body() reviewDto: ReviewSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.submissionsService.reviewSubmission(id, reviewDto, user.id);
  }
}
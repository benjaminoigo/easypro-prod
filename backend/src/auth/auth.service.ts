import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../users/user.entity';
import { Writer, WriterStatus } from '../writers/writer.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ResetPasswordWithOtpDto } from './dto/reset-password-with-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['writerProfile'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('Account not yet approved');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if writer is suspended
    if (user.role === UserRole.WRITER && user.writerProfile) {
      const writer = user.writerProfile;
      if (writer.status === WriterStatus.SUSPENDED) {
        throw new UnauthorizedException('Writer account is suspended');
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        writerProfile: user.writerProfile,
      },
    };
  }

  async register(registerDto: RegisterDto, inviteToken?: string) {
    // Verify invite token if provided
    if (inviteToken) {
      const inviteRecord = await this.userRepository.findOne({
        where: { inviteToken },
      });
      
      if (!inviteRecord) {
        throw new UnauthorizedException('Invalid invite token');
      }

      // Check if token has expired
      if (inviteRecord.inviteTokenExpiry && new Date() > inviteRecord.inviteTokenExpiry) {
        // Clean up expired invite
        await this.userRepository.remove(inviteRecord);
        throw new UnauthorizedException('Invite link has expired');
      }

      // Delete the placeholder user after validation
      await this.userRepository.remove(inviteRecord);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      isActive: true,
      isApproved: false, // Requires admin approval
    });

    const savedUser = await this.userRepository.save(user);

    // Create writer profile if role is writer
    if (savedUser.role === UserRole.WRITER) {
      const writer = this.writerRepository.create({
        userId: savedUser.id,
        status: WriterStatus.ACTIVE,
        balanceUSD: 0,
        lifetimeEarnings: 0,
      });
      await this.writerRepository.save(writer);
    }

    const { password, ...result } = savedUser;
    return result;
  }

  async generateInviteLink(expiryHours: number = 48): Promise<{ inviteToken: string; inviteUrl: string; expiresAt: Date }> {
    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);
    
    // Frontend URL for registration - MUST be set in production via FRONTEND_URL env var
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const defaultUrl = nodeEnv === 'production' ? '' : 'http://localhost:3002';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', defaultUrl);
    
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL environment variable must be set in production');
    }
    
    const inviteUrl = `${frontendUrl}/register?invite=${inviteToken}`;
    
    // Create a placeholder record with the invite token
    const placeholderUser = this.userRepository.create({
      email: `invite-${inviteToken}@placeholder.temp`,
      password: 'placeholder',
      firstName: 'Pending',
      lastName: 'Invite',
      role: UserRole.WRITER,
      isActive: false,
      isApproved: false,
      inviteToken,
      inviteTokenExpiry: expiresAt,
    });

    await this.userRepository.save(placeholderUser);

    return {
      inviteToken,
      inviteUrl,
      expiresAt,
    };
  }

  async approveUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.isApproved = true;
    return await this.userRepository.save(user);
  }

  async rejectUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.userRepository.remove(user);
  }

  async generatePasswordResetOtp(userId: string): Promise<{ otp: string; expiresAt: Date }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.resetOtpHash = await bcrypt.hash(otp, 10);
    user.resetOtpExpiry = expiresAt;
    await this.userRepository.save(user);

    return { otp, expiresAt };
  }

  async resetPasswordWithOtp(dto: ResetPasswordWithOtpDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtpHash = null;
      user.resetOtpExpiry = null;
      await this.userRepository.save(user);
      throw new BadRequestException('OTP has expired');
    }

    const isValid = await bcrypt.compare(dto.otp, user.resetOtpHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.resetOtpHash = null;
    user.resetOtpExpiry = null;
    await this.userRepository.save(user);
  }
}

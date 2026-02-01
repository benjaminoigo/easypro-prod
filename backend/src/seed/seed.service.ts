import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedAdmin() {
    const adminEmail = 'admin@easypro.com';
    
    // Check if admin already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('Admin user already exists');
      return existingAdmin;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    const admin = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      isApproved: true,
    });

    const savedAdmin = await this.userRepository.save(admin);
    
    this.logger.log(`Admin user created: ${adminEmail}`);
    this.logger.log('Default admin password: admin123456');
    this.logger.log('⚠️  Please change the admin password after first login');

    return savedAdmin;
  }
}
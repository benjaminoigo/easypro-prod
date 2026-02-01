import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Check for DATABASE_URL (Railway provides this)
  const databaseUrl = configService.get<string>('DATABASE_URL');
  
  if (databaseUrl) {
    // Parse DATABASE_URL for Railway deployment
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
      logging: configService.get<boolean>('DB_LOGGING', false),
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false),
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  // Fallback to individual environment variables (local development)
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_DATABASE', 'easypro'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
    logging: configService.get<boolean>('DB_LOGGING', false),
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false),
  };
};
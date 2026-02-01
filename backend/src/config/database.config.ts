import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  
  // Check for DATABASE_URL first (some cloud providers use this)
  const databaseUrl = configService.get<string>('DATABASE_URL');
  
  if (databaseUrl) {
    // Parse DATABASE_URL for cloud deployment
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

  // Use individual environment variables (Railway or local development)
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_DATABASE', 'easypro'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', !isProduction),
    logging: configService.get<boolean>('DB_LOGGING', false),
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false),
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};
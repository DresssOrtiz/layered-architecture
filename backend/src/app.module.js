import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessModule } from './business/business.module';
import { HealthController } from './presentation/health.controller';
import { UniEventsResolver } from './presentation/unievents.resolver';

@Module({
  imports: [
    BusinessModule,
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: true,
      graphiql: true,
      // El contexto por defecto solo expone req; el guard de rate limiting
      // necesita res para escribir las cabeceras RateLimit-*.
      context: ({ req, res }) => ({ req, res }),
    }),

    // forRootAsync: la fábrica corre al inicializar el módulo, no al importarlo,
    // así las pruebas pueden fijar los límites antes de compilar el contexto.
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          name: 'default',
          ttl: Number(process.env.RATE_LIMIT_TTL ?? 60000),
          limit: Number(process.env.RATE_LIMIT_INSCRIPCION ?? 5),
        },
      ],
    }),

    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER ?? 'layered_user',
      password: process.env.DB_PASSWORD ?? 'layered_password',
      database: process.env.DB_NAME ?? 'layered_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [HealthController],
  providers: [
    UniEventsResolver,
    // Como provider y no useGlobalPipes: así también valida bajo Test.createTestingModule.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ transform: true, whitelist: true }),
    },
  ],
})
export class AppModule {}

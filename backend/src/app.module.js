import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './presentation/app.controller';
import { AppService } from './business/app.service';
import { AppResolver } from './presentation/app.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: true,
      graphiql: true,
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
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}

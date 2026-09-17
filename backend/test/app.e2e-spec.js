import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/graphql returns the existing hello query', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'query { hello }' })
      .expect(200)
      .expect({ data: { hello: 'GraphQL funcionando' } });
  });

  it('connects TypeORM to MariaDB and executes SQL', async () => {
    const dataSource = app.get(DataSource);
    expect(dataSource.isInitialized).toBe(true);
    expect(dataSource.options.type).toBe('mariadb');
    expect(await dataSource.query('SELECT 1 AS connected')).toEqual([
      { connected: 1 },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });
});

/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import  request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /auth/register (success)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      })
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });

  it('POST /auth/register (validation fail)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'invalid', password: 'weak' })
      .expect(400);
  });

  it('GET /users/me (protected)', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test2@example.com', password: 'SecurePass123!', name: 'Test' });

    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .expect(200);
  });
});

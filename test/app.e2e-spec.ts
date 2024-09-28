// app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('ScryfallController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    app = moduleFixture.createNestApplication();
    await app.init();

    const payload = { username: 'testuser', sub: 'user-id' };
    token = jwtService.sign(payload);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should create a deck', () => {
    return request(app.getHttpServer())
      .post('/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({ commanderName: 'valid-commander-name' })
      .expect(HttpStatus.CREATED)
      .then(response => {
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('commander');
        expect(response.body.cards).toHaveLength(100);
      });
  });

  it('Should return 404', () => {
    return request(app.getHttpServer())
      .post('/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({ commanderName: 'invalid-commander-name' })
      .expect(HttpStatus.NOT_FOUND)
      .then(response => {
        expect(response.body.message).toBe('Commander not found');
      });
  });

  it('Should return 401', () => {
    return request(app.getHttpServer())
      .post('/decks')
      .send({ commanderName: 'valid-commander-name' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Should return 400', () => {
    return request(app.getHttpServer())
      .post('/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('Should GET decks', () => {
    return request(app.getHttpServer())
      .get('/decks')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK)
      .then(response => {
        expect(response.body).toHaveLength(10);
      });
  });

  it('Should for GET deck by id', () => {
    const deckId = 'deck-id';
    return request(app.getHttpServer())
      .get(`/decks/${deckId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK)
      .then(response => {
        expect(response.body).toHaveProperty('_id', deckId);
        expect(response.body).toHaveProperty('commander');
        expect(response.body.cards).toHaveLength(100);
      });
  });

  it('Should DELETE deck by id', () => {
    const deckId = 'deck-id';
    return request(app.getHttpServer())
      .delete(`/decks/${deckId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.NO_CONTENT);
  });
});
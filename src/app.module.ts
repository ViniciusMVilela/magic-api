import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ScryfallModule } from './auth/decorators/scryfall.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DeckModule } from './deck/deck.module';

@Module({
  imports: [
    ScryfallModule,
    HttpModule,
    MongooseModule.forRoot('mongodb://localhost/Api-Magic'),
    CacheModule.register({
      ttl: 120,
      max: 100,
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    DeckModule,
  ],
})
export class AppModule { }

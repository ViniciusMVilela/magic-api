import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ScryfallService } from '../../scryfall/scryfall.service';
import { ScryfallController } from '../../scryfall/scryfall.controller';
import { DeckSchema } from 'src/utils/schemas/deck.schema';
import { CardSchema } from 'src/utils/schemas/card.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'Deck', schema: DeckSchema }]),
    MongooseModule.forFeature([{ name: 'Card', schema: CardSchema }]),
  ],
  controllers: [ScryfallController],
  providers: [ScryfallService],
})
export class ScryfallModule { }

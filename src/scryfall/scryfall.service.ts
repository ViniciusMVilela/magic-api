import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CardDocument } from 'src/utils/schemas/card.schema';
import { DeckDocument } from 'src/utils/schemas/deck.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ScryfallService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel('Card') private readonly cardModel: Model<CardDocument>,
    @InjectModel('Deck') private readonly deckModel: Model<DeckDocument>,
  ) { }

  RESOURCE_URL = 'https://api.scryfall.com'

  async findAll(): Promise<DeckDocument[]> {
    try {
      return await this.deckModel.find().exec();
    } catch (error) {
      throw new HttpException('Error while fetching decks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUserId(userId: string): Promise<DeckDocument[]> {
    try {
      return await this.deckModel.find({ user: userId }).exec();
    } catch (error) {
      throw new HttpException('Error while fetching decks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findCardById(cardId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.RESOURCE_URL}/cards/${cardId}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException('Error while fetching card by ID', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchCard(query: string, page: number = 1): Promise<any> {
    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(`${this.RESOURCE_URL}/cards/search?q=${query}&page=${page}`)
      );
      if (!response.data || !response.data.data.length) {
        throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
      }
      return response.data;
    } catch (error) {
      throw new HttpException('Error while searching for card', HttpStatus.BAD_REQUEST);
    }
  }

  async save(deck: any[], userId: string, commanderName: string): Promise<DeckDocument> {
    try {
      const savedCards = await Promise.all(deck.map(async (card) => {
        const existingCard = await this.saveCard(card);
        return existingCard;
      }));

      const cardIds = savedCards.map(card => card._id);

      const savedDeck = await this.saveDeck(userId, commanderName, cardIds);
      return savedDeck;
    } catch (error) {
      throw new HttpException('Error while saving deck', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async saveFile(deck: any[]): Promise<void> {
    try {
      const filePath = path.join(__dirname, 'deck.json');
      fs.writeFileSync(filePath, JSON.stringify(deck, null, 2));
    } catch (error) {
      throw new HttpException('Error while saving deck to file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByCommander(colors: string[]): Promise<any[]> {
    try {
      const colorQuery = colors.join('');

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(`${this.RESOURCE_URL}/cards/search?q=format:commander+color<=${colorQuery}&order=edhrec&unique=cards`)
      );

      const cards = response.data.data;
      if (!cards.length) {
        throw new HttpException('Cards not found for this commander', HttpStatus.NOT_FOUND);
      }

      const deckCards = cards.slice(0, 99).map((card: any) => ({
        _id: card.id,
        name: card.name,
        type: card.type_line,
        manaCost: card.mana_cost,
        colors: card.colors,
        imageUrl: card.image_uris?.normal || null,
      }));

      return deckCards;
    } catch (error) {
      throw new HttpException('Error while getting deck by commander', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async saveCard(card: any): Promise<CardDocument> {
    let existingCard = await this.cardModel.findOne({ scryfallId: card._id }).exec();
    if (!existingCard) {
      const newCard = new this.cardModel({
        scryfallId: card._id,
        name: card.name,
        type: card.type,
        manaCost: card.manaCost,
        colors: card.colors,
        imageUrl: card.imageUrl,
      });
      existingCard = await newCard.save();
    }
    return existingCard;
  }

  private async saveDeck(userId: string, commanderName: string, cardIds: unknown[]): Promise<DeckDocument> {
    const deckDocument = new this.deckModel({
      user: userId,
      commander: commanderName,
      cards: cardIds as string[],
    });

    const savedDeck = await deckDocument.save();
    return savedDeck;
  }
}

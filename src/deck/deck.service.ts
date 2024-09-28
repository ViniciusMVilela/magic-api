import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deck } from './deck.schema';
import { Card } from './schemas/card.schema';

@Injectable()
export class DeckService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel('Deck') private deckModel: Model<Deck>,
    @InjectModel('Card') private cardModel: Model<Card>,
  ) { }

  RESOURCE_URL = 'https://api.scryfall.com'


  async findAll(): Promise<Deck[]> {
    try {
      const decks = await this.deckModel.find().populate('cards').exec();
      return decks;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching decks');
    }
  }

  async findById(id: string): Promise<Deck> {
    try {
      const deck = await this.deckModel.findById(id).populate('cards').exec();
      if (!deck) {
        throw new NotFoundException(`Deck with ID ${id} not found.`);
      }
      return deck;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching deck');
    }
  }

  async findByUserId(userId: string): Promise<Deck[]> {
    try {
      const decks = await this.deckModel.find({ user: userId }).populate('cards').exec();
      return decks;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching decks');
    }
  }

  async createCustomDeck(commander: any, cards: any[], userId: string): Promise<Deck> {
    try {
      if (!commander || !commander.color_identity || commander.color_identity.length === 0) {
        throw new NotFoundException(`The provided commander does not have color identity.`);
      }

      const cardsWithValidNameType = cards.filter(card => {
        return card && card.name && card.type;
      });

      const result = await this.saveCards(cardsWithValidNameType);

      const validCards = result.filter(card => card !== null);

      if (validCards.length === 0) {
        throw new NotFoundException('No cards were saved.');
      }

      const deck = await this.storeDeck(commander, validCards, userId);

      return deck;
    } catch (error) {
      console.error('Error creating custom deck:', error);
      throw new InternalServerErrorException(`Error creating custom deck: ${error.message}`);
    }
  }

  async storeDeckByCommander(commanderName: string, userId: string): Promise<Deck> {
    try {
      const commander = await this.getCommanderByName(commanderName);
      const cards = await this.getCardsByColorIdentity(commander.color_identity);
      const deckCards = cards.slice(0, 99);
      const savedCards = await this.saveCards(deckCards);
      const deck = await this.createDeck(commander.name, savedCards, userId);
      return deck;
    } catch (error) {
      throw new InternalServerErrorException('Error creating deck');
    }
  }

  private async getCommanderByName(commanderName: string): Promise<any> {
    const commanderResponse = await firstValueFrom(
      this.httpService.get(`${this.RESOURCE_URL}/cards/named?exact=${commanderName}`)
    );

    if (!commanderResponse.data) {
      throw new NotFoundException(`Commander ${commanderName} not found.`);
    }

    const commander = commanderResponse.data;

    if (!commander.color_identity || commander.color_identity.length === 0) {
      throw new NotFoundException(`Commander ${commanderName} does not have color identity.`);
    }

    return commander;
  }

  private async getCardsByColorIdentity(colorIdentity: string[]): Promise<any[]> {
    const colorIdentityString = colorIdentity.join('');
    const cardsResponse = await firstValueFrom(
      this.httpService.get(
        `${this.RESOURCE_URL}/cards/search?q=color_identity<=${colorIdentityString}&unique=cards&order=edhrec`
      )
    );
    const cards = cardsResponse.data.data;
    return cards;
  }

  private async saveCards(cards: any[]): Promise<any[]> {
    return Promise.all(
      cards.map(async (card) => {
        try {
          const newCard = new this.cardModel({
            name: card.name,
            type: card.type,
            manaCost: card.manaCost,
            colors: card.colors,
            scryfallId: card.scryfallId,
            imageUrl: card.imageUrl || '',
          });

          return await newCard.save();
        } catch (error) {
          console.error(`Error saving card "${card.name}":`, error);
          return null;
        }
      })
    );
  }

  private async createDeck(commanderName: string, savedCards: any[], userId: string): Promise<Deck> {
    const deck = new this.deckModel({
      commander: commanderName,
      cards: savedCards.map(savedCard => savedCard._id),
      user: userId,
    });

    if (!deck.cards.every(cardId => cardId)) {
      throw new BadRequestException('One or more card IDs are undefined.');
    }

    return await deck.save();
  }

  private async storeDeck(commander: any, savedCards: any[], userId: string): Promise<Deck> {
    const deck = new this.deckModel({
      commander: commander.name,
      cards: savedCards.map(savedCard => savedCard._id),
      user: userId,
    });

    if (!deck.cards.every(cardId => cardId)) {
      throw new BadRequestException('One or more card IDs are undefined.');
    }

    return await deck.save();
  }

}

import {
  Controller, Post, Body, Get, UseGuards, Request, Param, BadRequestException, InternalServerErrorException, UseInterceptors,
} from '@nestjs/common';
import { DeckService } from './deck.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { validateCommanderDeck } from './schemas/commander-validator';
import { DeckJson } from 'src/utils/interfaces/deck.interface';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('deck')
export class DeckController {
  constructor(private readonly service: DeckService) { }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  async findAll() {
    try {
      const decks = await this.service
        .findAll();
      return decks;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving all decks: ${error.message}`);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.User)
  async findById(@Param('id') id: string) {
    try {
      const deck = await this.service
        .findById(id);
      return deck;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving the deck with ID ${id}: ${error.message}`);
    }
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.User)
  async getDecksByUserId(@Param('userId') userId: string) {
    try {
      const decks = await this.service
        .findByUserId(userId);
      return decks;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving decks for user ${userId}: ${error.message}`);
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInterceptor)
  async getMyDecks(@Request() req) {
    const userId = req.user.userId;

    try {
      const decks = await this.service
        .findByUserId(userId);
      if (decks.length === 0) {
        return { message: 'You have no created decks.' };
      }
      return decks;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving your decks: ${error.message}`);
    }
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async create(@Body('commanderName') commanderName: string, @Body('userId') userId: string) {
    try {
      const deck = await this.service
        .storeDeckByCommander(commanderName, userId);
      return deck;
    } catch (error) {
      throw new InternalServerErrorException(`Error creating the deck: ${error.message}`);
    }
  }

  @Post('deckJson')
  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  async importCustomDeck(@Body() deckJson: DeckJson, @Request() req) {
    const userId = req.user.userId;
    const { commander, cards } = deckJson;

    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 99) {
      throw new BadRequestException('The deck must contain between 1 and 99 cards in addition to the commander.');
    }

    if (typeof commander !== 'object' || !commander.name) {
      throw new BadRequestException('The commander must be a valid object with a "name" property.');
    }

    const isValid = validateCommanderDeck(commander, cards);
    if (!isValid.valid) {
      throw new BadRequestException(isValid.message);
    }

    try {
      const savedDeck = await this.service
        .createCustomDeck(commander, cards, userId);
      return savedDeck;
    } catch (error) {
      throw new InternalServerErrorException(`Error importing the deck: ${error.message}`);
    }
  }
}

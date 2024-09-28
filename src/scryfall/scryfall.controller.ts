import { Controller, Get, Post, Body, Query, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ScryfallService } from './scryfall.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';


@Controller('scryfall')
export class ScryfallController {
  constructor(private readonly service: ScryfallService) { }

  @Roles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user-deck')
  async findDeckByUserId(@Req() req) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException('Unauthorized user', HttpStatus.UNAUTHORIZED);
      }

      const decks = await this.service.findByUserId(userId);
      return decks;
    } catch (error) {
      throw new HttpException('Error fetching decks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('deck')
  async findDeck(@Query('commanderId') commanderId: string) {
    try {
      if (!commanderId) {
        throw new HttpException('Commander ID is required', HttpStatus.BAD_REQUEST);
      }

      const commander = await this.service.findCardById(commanderId);
      if (!commander || !commander.colors) {
        throw new HttpException('Commander not found or invalid data', HttpStatus.NOT_FOUND);
      }

      const deck = await this.service.findByCommander(commander.colors);

      return deck;
    } catch (error) {
      throw new HttpException('Error fetching deck', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('decks')
  async findAllDecks() {
    try {
      const decks = await this.service.findAll();
      return decks;
    } catch (error) {
      throw new HttpException('Error fetching decks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('search-card')
  async findCard(@Query('q') query: string, @Query('page') page: number = 1) {
    try {
      if (!query) {
        throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
      }

      const response = await this.service.searchCard(query, page);
      return response;
    } catch (error) {
      throw new HttpException('Error searching for card', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('commander')
  async findCommander(@Query('page') page: number = 1) {
    try {
      const query = 'type:legendary+type:creature';
      const response = await this.service.searchCard(query, page);
      return response;
    } catch (error) {
      throw new HttpException('Error fetching commander', HttpStatus.BAD_REQUEST);
    }
  }


  @Post('deck')
  @UseGuards(JwtAuthGuard)
  async createDeck(@Body('commanderId') commanderId: string, @Req() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException('Unauthorized user', HttpStatus.UNAUTHORIZED);
      }

      if (!commanderId) {
        throw new HttpException('Commander is required', HttpStatus.BAD_REQUEST);
      }

      const commander = await this.service.findCardById(commanderId);
      if (!commander || !commander.colors) {
        throw new HttpException('Commander not found or invalid data', HttpStatus.NOT_FOUND);
      }

      const deck = await this.service.findByCommander(commander.colors);

      deck.unshift({
        _id: commander.id,
        name: commander.name,
        type: commander.type_line,
        manaCost: commander.mana_cost,
        colors: commander.colors,
        imageUrl: commander.image_uris?.normal || null,
      });

      await this.service.saveFile(deck);

      const savedDeck = await this.service.save(deck, userId, commander.name);

      return {
        message: 'Deck created successfully',
        deck: savedDeck,
      };
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}

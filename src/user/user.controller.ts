import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { UserService } from './users.service';
import { UpdateUserDTO } from 'src/utils/dto/updateUserDTO.dto';
import { CreateUserDTO } from 'src/utils/dto/createUserDTO.dto';


@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) { }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('/:user-name')
  async findOneByUsername(@Param('username') username: string) {
    return this.service.findByName(username);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDTO) {
    const updatedUser = await this.service.update(id, updateUserDto);
    return {
      message: `User with ID: ${id} successfully updated.`,
      user: updatedUser
    };
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDTO) {
    return this.service.create(createUserDto);
  }

  @Put('/:user-name')
  async updateByUsername(@Param('username') username: string, @Body() updateUserDto: UpdateUserDTO) {
    const updatedUser = await this.service.updateByUsername(username, updateUserDto);
    return {
      message: `User: ${username} successfully updated.`,
      user: updatedUser
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return {
      message: `User with ID: ${id} successfully deleted.`
    };
  }

  @Delete('/:user-name')
  async deleteByUsername(@Param('username') username: string) {
    await this.service.deleteByUsername(username);
    return {
      message: `User: ${username} successfully deleted.`
    };
  }
}


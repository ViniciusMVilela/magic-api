import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../utils/interfaces/user.interface';
import { CreateUserDTO } from 'src/utils/dto/createUserDTO.dto';
import { UpdateUserDTO } from 'src/utils/dto/updateUserDTO.dto';


@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) { }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByName(username: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ userName: username });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async role(userId: string): Promise<string> {
    const user = await this.findById(userId);
    return user.role;
  }

  async create(createUserDto: CreateUserDTO): Promise<User> {
    const { userName: username, password, email, role } = createUserDto;

    const existingUser = await this.userModel.findOne({ $or: [{ userName: username }, { email }] });
    if (existingUser) {
      throw new ConflictException('Username or email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      username,
      password: hashedPassword,
      email,
      role,
    });

    return await newUser.save();
  }


  async update(id: string, updateUserDto: UpdateUserDTO): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<UpdateUserDTO> = { ...updateUserDto };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    await user.save();

    return user;
  }

  async updateByUsername(username: string, updateUserDto: UpdateUserDTO): Promise<User> {
    const user = await this.userModel.findOne({ userName: username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<UpdateUserDTO> = { ...updateUserDto };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    await user.save();

    return user;
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async deleteByUsername(username: string): Promise<void> {
    const result = await this.userModel.findOneAndDelete({ userName: username });
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }
}

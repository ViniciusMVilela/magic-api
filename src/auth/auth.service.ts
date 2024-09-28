import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/users.service';
import * as bcrypt from 'bcrypt';
import { UserLoginDTO } from 'src/utils/dto/userLoginDTO';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService
  ) { }

  async validate(userName: string, password: string): Promise<any> {
    const user = await this.usersService.findByName(userName);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(loginDto: UserLoginDTO) {
    const user = await this.validate(loginDto.userName, loginDto.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    console.log('User after validation:', user);
    const payload = { userName: user.userName, userId: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

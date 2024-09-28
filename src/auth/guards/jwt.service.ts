import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  async userTokenGenerator(userId: string, userName: string, role: string): Promise<string> {
    const payload = { userId, userName, role };
    return this.jwtService.sign(payload);
  }
}

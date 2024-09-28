import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDTO } from 'src/utils/dto/userLoginDTO';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() userLogin: UserLoginDTO) {
    return this.authService.login(userLogin);
  }
}

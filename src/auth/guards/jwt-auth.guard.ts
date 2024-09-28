import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  handleRequestModified(error: any, user: any): any {
    if (error || !user) {
      throw error || new UnauthorizedException('"User not authenticated"');
    }
    return user;
  }
}

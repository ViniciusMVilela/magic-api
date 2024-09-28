import { IsString } from 'class-validator';

export class UserLoginDTO {
  @IsString()
  userName: string;

  @IsString()
  password: string;
}

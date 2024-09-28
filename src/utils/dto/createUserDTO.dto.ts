import { IsString, MinLength, MaxLength, IsEmail } from 'class-validator';
import { Role } from 'src/auth/decorators/role.enum';

export class CreateUserDTO {
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  readonly userName: string;

  @IsString()
  @MinLength(8)
  readonly password: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly role: Role;
}

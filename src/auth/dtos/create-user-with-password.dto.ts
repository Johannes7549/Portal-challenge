import { UserRole } from 'src/users/enums/user-role.enum';
import { CreateUserDto } from './create-user.dto';

export class CreateUserWithPasswordDto {
  constructor(
    public email: string,
    public username: string,
    public password: string,
    public fullName?: string,
  ) {}

  static fromDto(
    dto: CreateUserDto,
    hashedPassword: string,
  ): CreateUserWithPasswordDto {
    return new CreateUserWithPasswordDto(
      dto.email,
      dto.username,
      hashedPassword,
      dto.fullName,
    );
  }
}

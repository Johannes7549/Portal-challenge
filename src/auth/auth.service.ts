/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { CreateUserWithPasswordDto } from './dtos/create-user-with-password.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { User } from 'src/users/entities/user.entity';
import { UserDocument } from 'src/users/models/user.model';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(usernameOrEmail: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByUsernameOrEmail(usernameOrEmail);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const { usernameOrEmail, password } = dto;
    const user = await this.validateUser(usernameOrEmail, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id, username: user.username, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: user ? User.fromDocument(user) : null,
    };
  }

  async signup(body: CreateUserDto) {
    const { username, email, password } = body;

    const existingUser =
      await this.usersService.findByUsernameOrEmail(username);

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createPayload = CreateUserWithPasswordDto.fromDto(
      body,
      hashedPassword,
    );

    const user = await this.usersService.create(createPayload);

    return user;
  }
}

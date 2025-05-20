import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UpdateUserDto } from 'src/auth/dtos/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { User as UserDecorator } from 'src/decorators/user.decorator';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheKey('users_list')
  async listUsers(): Promise<User[]> {
    return this.usersService.listUsers();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@UserDecorator() user: User) {
    return this.usersService.findProfile(user.username);
  }

  @Delete(':username')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('username') username: string): Promise<User> {
    return this.usersService.deleteUser(username);
  }

  @Patch(':username')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async updateUser(
    @Param('username') username: string,
    @Body() payload: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(username, payload);
  }

  @Patch(':username/role')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @Param('username') username: string,
    @Body('role') role: UserRole,
  ): Promise<User> {
    return this.usersService.updateUserRole(username, role);
  }
}

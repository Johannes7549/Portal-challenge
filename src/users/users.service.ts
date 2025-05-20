import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { CreateUserWithPasswordDto } from 'src/auth/dtos/create-user-with-password.dto';
import { UpdateUserDto } from 'src/auth/dtos/update-user.dto';
import { BloomFilterService } from '../validation/bloom-filter/bloom-filter.service';
import { User } from './entities/user.entity';
import { UserDocument } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserDocument.name) private userModel: Model<UserDocument>,
    private readonly bloomFilterService: BloomFilterService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async listUsers(): Promise<User[]> {
    const response = await this.userModel.find().exec();

    return User.fromDocuments(response);
  }

  async findByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      })
      .exec();
  }

  async create(payload: CreateUserWithPasswordDto): Promise<User> {
    const user = new this.userModel(payload);
    const response = await user.save();

    // Add the new username to the Bloom filter
    await this.bloomFilterService.addUsername(response.username);

    // Invalidate the users list cache
    await this.cacheManager.del('users_list');

    return User.fromDocument(response);
  }

  async deleteUser(username: string): Promise<User> {
    console.log('deleteUser', username);
    const user = await this.userModel
      .findOneAndDelete({
        username,
      })
      .exec();

    if (!user) {
      throw new Error('User not found');
    }

    // Invalidate the users list cache
    await this.cacheManager.del('users_list');

    return User.fromDocument(user);
  }

  async findProfile(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();

    if (!user) {
      throw new Error('User not found');
    }

    return User.fromDocument(user);
  }

  async updateUser(username: string, payload: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ username }, payload, { new: true })
      .exec();

    if (!user) {
      throw new Error('User not found');
    }

    // Invalidate the users list cache
    await this.cacheManager.del('users_list');

    return User.fromDocument(user);
  }

  async updateUserRole(username: string, role: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { username },
      { role },
      { new: true },
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Invalidate the users list cache
    await this.cacheManager.del('users_list');

    return User.fromDocument(user);
  }
}

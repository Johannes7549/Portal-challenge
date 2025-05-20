import { Controller, Get, Param, Inject } from '@nestjs/common';
import { BloomFilterService } from './bloom-filter/bloom-filter.service';
import { UsersService } from '../users/users.service';

@Controller('validation')
export class ValidationController {
  constructor(
    private readonly bloomFilterService: BloomFilterService,
    private readonly usersService: UsersService,
  ) {}

  @Get('username/:username')
  async checkUsernameAvailability(
    @Param('username') username: string,
  ): Promise<{ available: boolean }> {
    // Check Bloom filter first
    const existsInBloomFilter = await this.bloomFilterService.usernameExists(username);

    // If Bloom filter says it doesn't exist, it definitely doesn't exist.
    if (!existsInBloomFilter) {
      return { available: true };
    }

    // If Bloom filter says it might exist (could be a false positive),
    // check the database for certainty.
    const user = await this.usersService.findByUsernameOrEmail(username);

    // If user is null, it means the username is available.
    return { available: !user };
  }
}

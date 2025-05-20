import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class BloomFilterService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private bloomFilterKey = 'usernames_bloom_filter';
  private bloomFilterErrorRate = 0.01; // 1% error rate
  private bloomFilterCapacity = 100000; // Estimated max number of usernames

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    // Check if the Bloom filter exists, if not, create it
    // Note: BF.INFO is used here as a simple check. In a production environment,
    // you might want a more robust initialization strategy.
    try {
      await this.redisClient.call('BF.INFO', this.bloomFilterKey);
    } catch (error) {
      // If BF.INFO fails, assume the filter doesn't exist and create it
      if (error.message.includes('Unknown key')) {
        console.log('Creating new Bloom filter...');
        await this.redisClient.call(
          'BF.RESERVE',
          this.bloomFilterKey,
          this.bloomFilterErrorRate,
          this.bloomFilterCapacity,
        );
        console.log('Bloom filter created.');
      } else {
        console.error('Error checking Bloom filter existence:', error);
      }
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async addUsername(username: string): Promise<void> {
    await this.redisClient.call('BF.ADD', this.bloomFilterKey, username);
  }

  async usernameExists(username: string): Promise<boolean> {
    const exists = await this.redisClient.call(
      'BF.EXISTS',
      this.bloomFilterKey,
      username,
    );
    return exists === 1;
  }
}

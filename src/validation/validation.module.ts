import { Module, forwardRef } from '@nestjs/common';
import { ValidationController } from './validation.controller';
import { BloomFilterService } from './bloom-filter/bloom-filter.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [ValidationController],
  providers: [BloomFilterService],
  exports: [BloomFilterService],
})
export class ValidationModule {}

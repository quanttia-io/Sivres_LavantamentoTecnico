import { Module } from '@nestjs/common';
import { LixeiraService } from './lixeira.service';
import { LixeiraController } from './lixeira.controller';

@Module({
  controllers: [LixeiraController],
  providers: [LixeiraService],
})
export class LixeiraModule {}

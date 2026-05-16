import { Module } from '@nestjs/common';
import { AnexosService } from './anexos.service';
import { AnexosController } from './anexos.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AnexosController],
  providers: [AnexosService],
})
export class AnexosModule {}

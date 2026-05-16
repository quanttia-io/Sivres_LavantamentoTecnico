import { Module } from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasController } from './assinaturas.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AssinaturasController],
  providers: [AssinaturasService],
})
export class AssinaturasModule {}

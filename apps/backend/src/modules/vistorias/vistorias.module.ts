import { Module } from '@nestjs/common';
import { VistoriasService } from './vistorias.service';
import { VistoriasController } from './vistorias.controller';
import { VistoriasNumeroService } from './vistorias-numero.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [VistoriasController],
  providers: [VistoriasService, VistoriasNumeroService],
  exports: [VistoriasService],
})
export class VistoriasModule {}

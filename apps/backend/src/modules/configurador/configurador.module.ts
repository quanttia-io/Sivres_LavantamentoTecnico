import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfiguradorController } from './configurador.controller';
import { ConfiguradorService } from './configurador.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguradorController],
  providers: [ConfiguradorService],
  exports: [ConfiguradorService],
})
export class ConfiguradorModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { appConfig, jwtConfig, storageConfig } from './config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CondominiosModule } from './modules/condominios/condominios.module';
import { VistoriasModule } from './modules/vistorias/vistorias.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { FotosModule } from './modules/fotos/fotos.module';
import { AnexosModule } from './modules/anexos/anexos.module';
import { AssinaturasModule } from './modules/assinaturas/assinaturas.module';
import { AprovacaoModule } from './modules/aprovacao/aprovacao.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { LixeiraModule } from './modules/lixeira/lixeira.module';
import { StorageModule } from './modules/storage/storage.module';
import { ConfiguradorModule } from './modules/configurador/configurador.module';
import { PrecificacaoModule } from './modules/precificacao/precificacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, storageConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CondominiosModule,
    VistoriasModule,
    ProdutosModule,
    TemplatesModule,
    ChecklistModule,
    FotosModule,
    AnexosModule,
    AssinaturasModule,
    AprovacaoModule,
    NotificacoesModule,
    PdfModule,
    AuditoriaModule,
    LixeiraModule,
    ConfiguradorModule,
    PrecificacaoModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}

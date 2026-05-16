import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LixeiraService } from './lixeira.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Lixeira')
@ApiBearerAuth()
@Roles(Role.ADMINISTRADOR)
@Controller('lixeira')
export class LixeiraController {
  constructor(private service: LixeiraService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vistorias na lixeira' })
  listar() {
    return this.service.listar();
  }

  @Post(':id/recuperar')
  @ApiOperation({ summary: 'Recuperar vistoria da lixeira' })
  recuperar(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.service.recuperar(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Exclusão permanente da vistoria' })
  excluirPermanente(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.service.excluirPermanente(id, user);
  }
}

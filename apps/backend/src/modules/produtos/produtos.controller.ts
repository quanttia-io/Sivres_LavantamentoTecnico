import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/create-produto.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
export class ProdutosController {
  constructor(private service: ProdutosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  findAll(@Query('search') search?: string, @Query('todos') todos?: string) {
    return this.service.findAll(search, todos !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(@Body() dto: CreateProdutoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('importar')
  @Roles(Role.ADMINISTRADOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar produtos via Excel (.xlsx)' })
  importar(@UploadedFile() file: Express.Multer.File) {
    return this.service.importarExcel(file.buffer);
  }
}

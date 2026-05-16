import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';

@ApiTags('PDF')
@ApiBearerAuth()
@Controller('vistorias/:id/pdf')
export class PdfController {
  constructor(private service: PdfService) {}

  @Get()
  @ApiOperation({ summary: 'Gerar PDF da vistoria' })
  async gerar(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.gerar(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="vistoria-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}

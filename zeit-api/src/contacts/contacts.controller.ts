import { Controller, Post, Get, Body, Query, Param, UseGuards, Request, Put, Delete, Patch, BadRequestException, Res, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { FilterContactDto } from './dto/filter-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateContactDto } from './dto/update-contact.dto';
import * as XLSX from 'xlsx';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { Multer } from 'multer';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) { }

  @Post()
  create(@Body() dto: CreateContactDto, @Request() req) {
    return this.contactsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filters: FilterContactDto) {
    return this.contactsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
  @Patch(':id/unsubscribe')
  unsubscribe(@Param('id') id: string) {
    return this.contactsService.unsubscribe(id);
  }

  @Patch(':id/resubscribe')
  resubscribe(@Param('id') id: string) {
    return this.contactsService.resubscribe(id);
  }

  // 1. Download do Modelo Excel idêntico ao padrão Zeit Qualis
  @Get('import/template')
  downloadTemplate(@Res() res: express.Response) {
    const wsData = [
      ['Nome','Telefone','País/Região','Origem','Ocupação','Atividade comercial','Príximo passo','Interesses','Observações','Email','CPF/CNPJ','Cidade','Setor','Nome da empresa','Data da última atividade','Notas'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=modelo_importacao_zeit.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  // 2. Processar upload da planilha e importar para o banco
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importLeads(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const userId = req.user.id; // ID do usuário autenticado no sistema

    return this.contactsService.importFromExcel(file.buffer, userId);
  }
}
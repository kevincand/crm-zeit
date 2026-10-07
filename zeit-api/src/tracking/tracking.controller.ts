import { Controller, Get, Param, Res, Req } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import type { Request, Response } from 'express';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('open/:recipientId')
  async trackOpen(
    @Param('recipientId') recipientId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    // Dispara o registro em segundo plano para não atrasar a resposta da imagem
    this.trackingService.trackOpen(recipientId, ip, userAgent).catch(() => {});

    // Retorna a imagem GIF transparente 1x1
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.send(this.trackingService.getPixelBuffer());
  }

  @Get('click/:linkId/:recipientId')
  async trackClick(
    @Param('linkId') linkId: string,
    @Param('recipientId') recipientId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      const targetUrl = await this.trackingService.trackClick(linkId, recipientId, ip, userAgent);
      return res.redirect(targetUrl);
    } catch(erro) {
      // Caso o link não exista ou ocorra erro, redireciona para uma página segura
      return res.redirect('https://zeit.com.br');
    }
  }
}
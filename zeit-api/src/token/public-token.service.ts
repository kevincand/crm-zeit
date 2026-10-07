import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface UnsubscribePayload {
  contactId: string;
  action: 'unsubscribe' | 'confirm_subscription';
}

@Injectable()
export class PublicTokensService {
  constructor(private jwtService: JwtService) {}

  // Gera o token assinado para inserir no rodapé dos e-mails
  generateUnsubscribeToken(contactId: string): string {
    return this.jwtService.sign(
      { contactId, action: 'unsubscribe' },
      { expiresIn: '30d' } // Validade longa para e-mails antigos na caixa de entrada
    );
  }

  // Valida o token recebido da rota pública
  verifyUnsubscribeToken(token: string): UnsubscribePayload {
    try {
      const payload = this.jwtService.verify<UnsubscribePayload>(token);
      if (payload.action !== 'unsubscribe') {
        throw new BadRequestException('Ação do token inválida.');
      }
      return payload;
    } catch {
      throw new BadRequestException('Link de descadastro inválido ou expirado.');
    }
  }
}
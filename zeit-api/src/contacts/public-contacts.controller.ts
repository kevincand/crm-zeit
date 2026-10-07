import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { PublicTokensService } from "../token/public-token.service";
import { ContactsService } from "./contacts.service";
import { PublicSubscribeDto } from "./dto/public-subscribe.dto";

@Controller('public/contacts')
export class PublicContactsController {
  constructor(
    private publicTokensService: PublicTokensService,
    private contactsService: ContactsService,
  ) { }

  @Post('unsubscribe')
  async unsubscribeWithToken(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token é obrigatório.');
    }

    // Decodifica e valida o token com segurança
    const { contactId } = this.publicTokensService.verifyUnsubscribeToken(token);
    // Executa a baixa no banco de dados (SubscriptionStatus.UNSUBSCRIBED)
    return this.contactsService.unsubscribe(contactId);
  }

  @Post('subscribe')
  publicSubscribe(@Body() dto: PublicSubscribeDto) {
    return this.contactsService.publicSubscribe(dto);
  }
}
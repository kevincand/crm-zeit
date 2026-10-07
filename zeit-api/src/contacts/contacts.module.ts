import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PublicContactsController } from './public-contacts.controller';
import { PublicTokensService } from '../token/public-token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'sua_chave_secreta' }), // Necessário se usar JwtService
    ],
  providers: [ContactsService, PublicTokensService],
  controllers: [ContactsController, PublicContactsController]
})
export class ContactsModule {}

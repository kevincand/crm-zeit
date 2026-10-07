import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GroupsModule } from './groups/groups.module';
import { InterestsModule } from './interests/interests.module';
import { ContactsModule } from './contacts/contacts.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { MailModule } from './mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TrackingModule } from './tracking/tracking.module';
import { StatsModule } from './stats/stats.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule, AuthModule, PrismaModule, GroupsModule, InterestsModule, ContactsModule, NewsletterModule, MailModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
    }),
    CampaignsModule,
    TrackingModule,
    StatsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

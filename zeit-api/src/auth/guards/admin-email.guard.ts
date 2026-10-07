import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Injetado pelo JwtAuthGuard via token JWT

    if (user?.email !== 'admin@zeit.com.br') {
      throw new ForbiddenException('Acesso negado: Apenas o e-mail master possui permissão para esta ação.');
    }

    return true;
  }
}
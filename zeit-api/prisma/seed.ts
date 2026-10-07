import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, UserRole } from '../generated/prisma/client.ts';
import * as argon2 from 'argon2';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@zeit.com.br';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('A variável INITIAL_ADMIN_PASSWORD não foi informada no arquivo .env');
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword);
    await prisma.user.create({
      data: {
        name: 'Administrador Zeit',
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    console.log(`✅ Usuário Admin inicial criado para: ${adminEmail}`);
  } else {
    console.log('ℹ️ Usuário Admin já existe na base.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
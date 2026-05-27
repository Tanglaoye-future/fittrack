import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class SupplementsService {
  constructor(private readonly prisma: PrismaService) {}
}

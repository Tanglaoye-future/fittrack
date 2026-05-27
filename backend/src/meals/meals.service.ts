import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}
}

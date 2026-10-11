import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.genre.findMany({
      select: {
        id: true, name: true, normalizedName: true, parentId: true,
        parent: { select: { name: true } },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
  }
}

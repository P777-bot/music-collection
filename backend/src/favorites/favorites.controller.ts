import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.favoritesService.findForUser(request.user!.id);
  }

  @Post(':songId')
  add(
    @Req() request: AuthenticatedRequest,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    return this.favoritesService.add(request.user!.id, songId);
  }

  @Delete(':songId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    return this.favoritesService.remove(request.user!.id, songId);
  }
}

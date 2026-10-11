import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SongsModule } from './songs/songs.module';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ArtistsModule } from './artists/artists.module';

@Module({
  imports: [PrismaModule, SongsModule, AuthModule, FavoritesModule, ArtistsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

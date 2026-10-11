import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SongsController, GenresController],
  providers: [SongsService, GenresService],
})
export class SongsModule {}

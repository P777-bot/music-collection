import { Component, signal } from '@angular/core';
import { Song } from './song';
import { SongCard } from '../song-card/song-card';

@Component({
  selector: 'app-song-list',
  imports: [SongCard],
  templateUrl: './song-list.html',
  styleUrl: './song-list.css',
})
export class SongList {
  songs = signal<Song[]>([]);
}

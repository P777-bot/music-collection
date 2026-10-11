import { Component, input } from '@angular/core';
import type { Song } from '../song-list/song';

@Component({
  selector: 'app-song-card',
  imports: [],
  templateUrl: './song-card.html',
  styleUrl: './song-card.css',
})
export class SongCard {
  song = input.required<Song>();
}
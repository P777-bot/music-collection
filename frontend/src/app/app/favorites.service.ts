import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FavoriteSong {
  id: number;
  name: string;
  album: string;
  genre: string;
  releaseDate: string;
  coverUrl: string | null;
  artist: { id: number; name: string };
}

export interface FavoriteRecord {
  songId: number;
  createdAt: string;
  song: FavoriteSong;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl.replace(/\/+$/, '')}/favorites`;
  readonly records = signal<FavoriteRecord[]>([]);
  readonly songIds = signal<ReadonlySet<number>>(new Set());

  load(): Observable<FavoriteRecord[]> {
    return this.http.get<FavoriteRecord[]>(this.baseUrl, { withCredentials: true })
      .pipe(tap(records => this.setRecords(records)));
  }

  add(songId: number): Observable<FavoriteRecord> {
    return this.http.post<FavoriteRecord>(`${this.baseUrl}/${songId}`, {}, { withCredentials: true })
      .pipe(tap(record => {
        const records = this.records();
        if (!this.songIds().has(songId)) this.setRecords([record, ...records]);
      }));
  }

  remove(songId: number): Observable<{ songId: number; favorited: false }> {
    return this.http.delete<{ songId: number; favorited: false }>(`${this.baseUrl}/${songId}`, { withCredentials: true })
      .pipe(tap(() => this.setRecords(this.records().filter(record => record.songId !== songId))));
  }

  clear(): void { this.setRecords([]); }

  private setRecords(records: FavoriteRecord[]): void {
    this.records.set(records);
    this.songIds.set(new Set(records.map(record => record.songId)));
  }
}

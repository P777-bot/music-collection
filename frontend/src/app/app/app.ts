
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, of, switchMap, timeout } from 'rxjs';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { FavoritesService } from './favorites.service';
import { LanguageService, type AppLanguage } from './language.service';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

type Page = 'home' | 'discover' | 'artists' | 'artist' | 'detail' | 'add' | 'edit' | 'login' | 'register' | 'favorites';

interface Song {
  id: number;
  artistId: number;
  createdById: number | null;
  name: string;
  artist: string;
  album: string;
  genre: string;
  genres: string[];
  date: string;
  cls: string;
  coverUrl?: string | null;
  youtubeUrl?: string | null;
  lyrics?: string | null;
  youtubeEmbedUrl?: SafeResourceUrl | null;
}

interface ApiSong {
  id: number;
  artistId?: number;
  createdById?: number | null;
  name: string;
  album: string;
  genre: string;
  releaseDate: string;
  coverUrl?: string | null;
  youtubeUrl?: string | null;
  lyrics?: string | null;
  genres?: Array<{ id: number; name: string; parentId: number | null }>;
  artist: {
    id: number;
    name: string;
  };
}

interface SongForm {
  name: string;
  artist: string;
  album: string;
  genre: string;
  selectedGenres: string[];
  date: string;
  url: string;
  youtubeUrl: string;
  lyrics: string;
}

interface ArtistSummary {
  id: number;
  name: string;
  songCount: number;
  albumCount: number;
}

interface ArtistAlbum {
  name: string;
  songCount: number;
  coverUrl: string | null;
  songs: Song[];
}

interface ArtistDetail extends ArtistSummary {
  albums: ArtistAlbum[];
  unalbumedSongs: Song[];
  songs: Song[];
}

interface ApiArtistDetail {
  id: number;
  name: string;
  songCount: number;
  albumCount: number;
  albums: Array<{ name: string; songCount: number; coverUrl: string | null; songs: ApiSong[] }>;
  unalbumedSongs: ApiSong[];
  songs: ApiSong[];
}

interface GenreOption {
  id: number;
  name: string;
  parentId: number | null;
  parent?: { name: string } | null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  // API origin comes from the Angular environment configuration.
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private readonly apiUrl = `${this.apiBaseUrl}/songs`;
  private readonly genresUrl = `${this.apiBaseUrl}/genres`;
  private readonly artistsUrl = `${this.apiBaseUrl}/artists`;

  private toastTimer?: ReturnType<typeof setTimeout>;

  page: Page = 'home';
  songs: Song[] = [];
  selectedId = 0;

  search = '';
  selectedGenres: string[] = [];
  genres: GenreOption[] = [];
  artists: ArtistSummary[] = [];
  artistDetail: ArtistDetail | null = null;
  artistSearch = '';
  artistId = 0;
  selectedAlbum: string | null = null;
  loadingArtists = false;
  loadingArtistDetail = false;
  artistError = '';
  private loadedArtistDirectory = false;
  private loadedArtistId?: number;

  deleteOpen = false;
  toast = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  loadingSongs = false;
  loadError = '';

  savingAdd = false;
  savingEdit = false;
  deletingSong = false;
  savingAuth = false;
  loadingFavorites = false;
  favoritesError = '';
  favoriteBusyIds = new Set<number>();
  authForm = { email: '', password: '', confirmPassword: '' };
  showPassword = false;
  private loadedFavoritesForUser?: number;

  addForm: SongForm = this.emptyForm();
  editForm: SongForm = this.emptyForm();

  constructor(
  private readonly http: HttpClient,
  private readonly cdr: ChangeDetectorRef,
  private readonly router: Router,
  readonly auth: AuthService,
  readonly favoritesApi: FavoritesService,
  readonly language: LanguageService,
  private readonly sanitizer: DomSanitizer,
) {}

  tr(key: string): string { return this.language.text(key); }
  toggleLanguage(): void { this.language.toggle(); }

  ngOnInit(): void {
    document.documentElement.lang = this.language.language();
    this.syncPageFromUrl();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.syncPageFromUrl();
    });
    this.auth.restoreSession().subscribe(user => {
      if (!user) this.favoritesApi.clear();
      else if (this.page === 'favorites') this.loadFavorites();
      if (user && (this.page === 'login' || this.page === 'register')) {
        void this.router.navigateByUrl('/discover', { replaceUrl: true });
      }
      this.cdr.markForCheck();
    });
    this.loadSongs();
    this.loadGenres();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private emptyForm(): SongForm {
    return {
      name: '',
      artist: '',
      album: '',
      genre: '',
      selectedGenres: [],
      date: '',
      url: '',
      youtubeUrl: '',
      lyrics: '',
    };
  }

  private mapApiSong(song: ApiSong, index = 0): Song {
    return {
      id: song.id,
      artistId: song.artistId ?? song.artist?.id ?? 0,
      createdById: song.createdById ?? null,
      name: song.name,
      artist: song.artist?.name ?? 'Unknown Artist',
      album: song.album,
      genre: song.genre,
      genres: song.genres?.map(genre => genre.name) ?? [],
      date: song.releaseDate?.substring(0, 10) ?? '',
      coverUrl: song.coverUrl ?? null,
      youtubeUrl: song.youtubeUrl ?? null,
      lyrics: song.lyrics ?? null,
      youtubeEmbedUrl: this.toYoutubeEmbedUrl(song.youtubeUrl),
      cls: ['one', 'two', 'three', 'four', 'five', 'six'][index % 6]
    };
  }

  private getPayload(form: SongForm) {
    return {
      name: form.name.trim(),
      artist: form.artist.trim(),
      album: form.album.trim(),
      genre: form.selectedGenres.length ? form.selectedGenres[0] : form.genre.trim(),
      ...(form.selectedGenres.length ? { genres: form.selectedGenres } : {}),
      releaseDate: form.date,
      coverUrl: form.url.trim() || null,
      youtubeUrl: form.youtubeUrl.trim() || null,
      lyrics: form.lyrics.trim() || null
    };
  }

  private toYoutubeEmbedUrl(value?: string | null): SafeResourceUrl | null {
    const videoId = this.extractYouTubeVideoId(value);
    return videoId
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${videoId}`)
      : null;
  }

  private extractYouTubeVideoId(value?: string | null): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
      let id: string | null = null;
      if (url.hostname === 'youtu.be') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length === 1) id = parts[0];
      } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (url.pathname === '/watch') id = url.searchParams.get('v');
        else if (parts.length === 2 && parts[0] === 'shorts') id = parts[1];
      }
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
      return null;
    }
  }

  safeYouTubeWatchUrl(value?: string | null): string | null {
    const id = this.extractYouTubeVideoId(value);
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  }

  get visibleArtists(): ArtistSummary[] {
    const query = this.artistSearch.trim().toLocaleLowerCase();
    return this.artists.filter(artist => artist.name.toLocaleLowerCase().includes(query));
  }

  get visibleArtistSongs(): Song[] {
    const songs = this.artistDetail?.songs ?? [];
    return this.selectedAlbum === null
      ? songs
      : songs.filter(song => song.album === this.selectedAlbum);
  }

  private mapArtistDetail(response: ApiArtistDetail): ArtistDetail {
    const mapSongs = (songs: ApiSong[]) => songs.map((song, index) => this.mapApiSong(song, index));
    return {
      id: response.id,
      name: response.name,
      songCount: response.songCount,
      albumCount: response.albumCount,
      albums: response.albums.map(album => ({ ...album, songs: mapSongs(album.songs) })),
      unalbumedSongs: mapSongs(response.unalbumedSongs),
      songs: mapSongs(response.songs),
    };
  }

  loadArtists(force = false): void {
    if (this.loadingArtists || (this.loadedArtistDirectory && !force)) return;
    this.loadingArtists = true;
    this.artistError = '';
    this.http.get<ArtistSummary[]>(this.artistsUrl).pipe(finalize(() => {
      this.loadingArtists = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: artists => {
        this.artists = artists;
        this.loadedArtistDirectory = true;
      },
      error: error => { this.artistError = this.getErrorMessage(error); },
    });
  }

  loadArtistDetail(id = this.artistId, force = false): void {
    if (!id || this.loadingArtistDetail || (this.loadedArtistId === id && !force)) return;
    this.loadingArtistDetail = true;
    this.artistError = '';
    this.artistDetail = null;
    this.http.get<ApiArtistDetail>(`${this.artistsUrl}/${id}`).pipe(finalize(() => {
      this.loadingArtistDetail = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: response => {
        this.artistDetail = this.mapArtistDetail(response);
        this.loadedArtistId = id;
      },
      error: error => {
        this.artistError = this.getErrorMessage(error);
        this.loadedArtistId = undefined;
      },
    });
  }

  openArtist(id: number): void {
    if (!id) return;
    void this.router.navigate(['/artists', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectArtistAlbum(album: string | null): void {
    this.selectedAlbum = album;
    void this.router.navigate([], { queryParams: { album: album || null }, queryParamsHandling: 'merge' });
  }

  artistYear(song: Song): string { return song.date ? song.date.slice(0, 4) : ''; }

  onArtistSearchInput(): void {
    void this.router.navigate([], {
      queryParams: { q: this.artistSearch || null },
      queryParamsHandling: 'merge',
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return this.tr('Cannot connect to the backend. Check the network or CORS configuration.');
      }

      if (error.status === 400 || error.status === 422) {
        return this.tr('The submitted data is invalid.');
      }

      if (error.status === 401) {
        return this.tr('Your session is missing or expired. Please log in.');
      }

      if (error.status === 403) {
        return this.tr('You do not have permission to perform this action.');
      }

      if (error.status === 409) {
        const detail = error.error?.message;
        return this.tr(detail === 'This song already exists in the selected artist and album.'
          ? detail
          : 'This conflicts with existing data.');
      }

      if (error.status === 404) {
        return this.tr('The requested item was not found.');
      }

      if (error.status >= 500) {
        return this.tr('The server could not complete this request.');
      }
    }

    return this.tr('The request failed. Please try again.');
  }

  loadGenres(): void {
    this.http.get<GenreOption[]>(this.genresUrl).subscribe({
      next: genres => { this.genres = genres; this.cdr.markForCheck(); },
      error: error => {
        console.error('โหลดหมวดเพลงไม่สำเร็จ:', error);
        this.showToast(this.getErrorMessage(error), 'error');
      },
    });
  }

  toggleFilterGenre(genre: string): void {
    this.selectedGenres = this.selectedGenres.includes(genre)
      ? this.selectedGenres.filter(value => value !== genre)
      : [...this.selectedGenres, genre];
  }

  toggleFormGenre(form: SongForm, genre: string): void {
    form.selectedGenres = form.selectedGenres.includes(genre)
      ? form.selectedGenres.filter(value => value !== genre)
      : [...form.selectedGenres, genre];
  }

  clearFilters(): void {
    this.search = '';
    this.selectedGenres = [];
    if (this.page === 'discover') {
      void this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge' });
    }
  }

  displayGenres(song: Song): string[] {
    return song.genres.length ? song.genres : [song.genre];
  }

  displayGenreText(song: Song): string {
    return this.displayGenres(song).map(genre => this.tr(genre)).join(', ');
  }

  private normalize(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase('en')
      .replace(/['’]/g, '')
      .replace(/[–—-]/g, ' ')
      .replace(/\s*&\s*/g, ' and ')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  get filteredSongs(): Song[] {
    const query = this.normalize(this.search);
    const selected = new Set(this.selectedGenres.map(value => this.normalize(value)));
    for (const selectedGenre of this.selectedGenres) {
      const parent = this.genres.find(genre => this.normalize(genre.name) === this.normalize(selectedGenre));
      if (parent) {
        this.genres.filter(genre => genre.parentId === parent.id)
          .forEach(genre => selected.add(this.normalize(genre.name)));
      }
    }

    return this.songs.filter(song => {
      const searchableText = this.normalize([
        song.name,
        song.artist,
        song.album,
        song.genre,
        ...song.genres
      ].join(' '));

      // ค้นหาคำเต็มหรือบางส่วน โดยไม่สนใจช่องว่างหัวท้าย
      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesGenre = selected.size === 0 ||
        song.genres.some(genre => selected.has(this.normalize(genre)));

      return matchesSearch && matchesGenre;
    });
  }

  get visibleSongs(): Song[] {
    return this.filteredSongs.filter(song =>
      this.page !== 'favorites' || this.favoritesApi.songIds().has(song.id)
    );
  }

  get selectedSong(): Song | undefined {
    return this.songs.find(song => song.id === this.selectedId);
  }

  canManage(song: Song): boolean {
    const user = this.auth.user();
    return !!user && (user.role === 'ADMIN' || song.createdById === user.id);
  }

  loadSongs(): void {
    if (this.loadingSongs) return;

    this.loadingSongs = true;
    this.loadError = '';

    this.http.get<ApiSong[]>(this.apiUrl)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.loadingSongs = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: data => {
          this.songs = data.map((song, index) =>
            this.mapApiSong(song, index)
          );

          const selectionExists = this.songs.some(song => song.id === this.selectedId);
          if (!selectionExists && (this.page === 'detail' || this.page === 'edit')) {
            this.loadError = 'ไม่พบเพลงที่ต้องการ';
          } else if (!selectionExists) {
            this.selectedId = this.songs[0]?.id ?? 0;
          }

          if (this.page === 'edit' && this.selectedSong) {
            const song = this.selectedSong;
            this.editForm = {
              name: song.name,
              artist: song.artist,
              album: song.album,
              genre: song.genre,
              selectedGenres: song.genres,
              date: song.date,
              url: song.coverUrl ?? '',
              youtubeUrl: song.youtubeUrl ?? '',
              lyrics: song.lyrics ?? '',
            };
          }
        },
        error: error => {
          console.error('โหลดข้อมูลเพลงไม่สำเร็จ:', error);
        this.loadError = this.getErrorMessage(error);
        }
      });
  }

  go(page: Page): void {
    if ((page === 'add' || page === 'edit') && !this.auth.user()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: page === 'edit' ? `/songs/${this.selectedId}/edit` : '/add' } });
      return;
    }
    this.page = page;
    const path = page === 'home' ? '/' :
      page === 'discover' ? '/discover' :
      page === 'artists' ? '/artists' :
      page === 'artist' ? `/artists/${this.artistId}` :
      page === 'favorites' ? '/favorites' :
      page === 'login' ? '/login' :
      page === 'register' ? '/register' :
      page === 'detail' ? `/songs/${this.selectedId}` :
      page === 'edit' ? `/songs/${this.selectedId}/edit` : '/add';
    void this.router.navigateByUrl(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goHome(): void {
    this.search = '';
    this.selectedGenres = [];
    this.go('home');
  }

  goDiscover(): void {
    this.page = 'discover';
    void this.router.navigate(['/discover'], {
      queryParams: { q: this.search || null },
    });
  }

  submitHomeSearch(): void {
    this.goDiscover();
  }

  onSearchInput(): void {
    if (this.page === 'home') this.goDiscover();
    else if (this.page === 'discover') {
      void this.router.navigate([], {
        queryParams: { q: this.search || null },
        queryParamsHandling: 'merge',
      });
    }
  }

  private syncPageFromUrl(): void {
    const url = this.router.url;
    if (url.startsWith('/discover')) this.page = 'discover';
    else if (/^\/artists\/\d+(?:\?|$)/.test(url)) {
      this.page = 'artist';
      const parsed = this.router.parseUrl(url);
      this.artistId = Number(parsed.root.children['primary']?.segments[1]?.path ?? url.split('/')[2]);
      this.selectedAlbum = typeof parsed.queryParams['album'] === 'string' ? parsed.queryParams['album'] : null;
      if (this.loadedArtistId !== this.artistId || !this.artistDetail) this.loadArtistDetail(this.artistId);
    }
    else if (url.startsWith('/artists')) {
      this.page = 'artists';
      const query = this.router.parseUrl(url).queryParams['q'];
      this.artistSearch = typeof query === 'string' ? query : this.artistSearch;
      if (!this.loadedArtistDirectory) this.loadArtists();
    }
    else if (url.startsWith('/favorites')) {
      this.page = 'favorites';
      if (this.auth.user() && this.loadedFavoritesForUser !== this.auth.user()!.id) this.loadFavorites();
    }
    else if (url.startsWith('/login')) this.page = 'login';
    else if (url.startsWith('/register')) this.page = 'register';
    else if (/^\/songs\/\d+\/edit(?:\?|$)/.test(url)) {
      this.page = 'edit';
      this.selectedId = Number(url.split('/')[2]);
    } else if (/^\/songs\/\d+(?:\?|$)/.test(url)) {
      this.page = 'detail';
      this.selectedId = Number(url.split('/')[2]);
    } else if (url.startsWith('/add')) this.page = 'add';
    else this.page = 'home';

    if (this.page === 'discover') {
      this.search = this.router.parseUrl(url).queryParams['q'] ?? '';
    }
  }

  private loadFavorites(): void {
    const user = this.auth.user();
    if (!user || this.loadingFavorites || this.loadedFavoritesForUser === user.id) return;
    this.loadingFavorites = true;
    this.favoritesError = '';
    this.favoritesApi.load().pipe(finalize(() => {
      this.loadingFavorites = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.loadedFavoritesForUser = user.id; },
      error: error => {
        this.favoritesError = this.getErrorMessage(error);
        this.showToast(this.favoritesError, 'error');
      },
    });
  }

  retryFavorites(): void {
    this.loadedFavoritesForUser = undefined;
    this.loadFavorites();
  }

  isFavorite(songId: number): boolean {
    return this.favoritesApi.songIds().has(songId);
  }

  toggleFavorite(song: Song): void {
    const user = this.auth.user();
    if (!user) {
      this.showToast('กรุณาเข้าสู่ระบบก่อนบันทึกเพลงโปรด', 'warning');
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.favoriteBusyIds.has(song.id)) return;
    this.favoriteBusyIds = new Set(this.favoriteBusyIds).add(song.id);
    const request: Observable<unknown> = this.isFavorite(song.id)
      ? this.favoritesApi.remove(song.id)
      : this.favoritesApi.add(song.id);
    request.pipe(finalize(() => {
      const remaining = new Set(this.favoriteBusyIds);
      remaining.delete(song.id);
      this.favoriteBusyIds = remaining;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => this.showToast(this.isFavorite(song.id) ? 'เพิ่มเพลงใน Favorites แล้ว' : 'นำเพลงออกจาก Favorites แล้ว'),
      error: error => this.showToast(this.getErrorMessage(error), 'error'),
    });
  }

  submitAuth(): void {
    if (this.savingAuth) return;
    if (this.page === 'register' && this.authForm.password.length < 15) {
      this.showToast('รหัสผ่านต้องมีอย่างน้อย 15 ตัวอักษร (Password must be at least 15 characters).', 'error');
      return;
    }
    if (this.page === 'register' && this.authForm.password !== this.authForm.confirmPassword) {
      this.showToast('รหัสผ่านไม่ตรงกัน (Passwords do not match).', 'error');
      return;
    }
    this.savingAuth = true;
    const action = this.page === 'register'
      ? this.auth.register(this.authForm.email, this.authForm.password)
      : this.auth.login(this.authForm.email, this.authForm.password);
    action.pipe(finalize(() => {
      this.savingAuth = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.authForm = { email: '', password: '', confirmPassword: '' };
        this.favoritesApi.clear();
        this.favoritesError = '';
        this.loadedFavoritesForUser = undefined;
        this.showToast(this.page === 'register' ? 'สมัครสมาชิกสำเร็จ' : 'เข้าสู่ระบบสำเร็จ');
        const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
        const destination = typeof returnUrl === 'string' && returnUrl.startsWith('/') &&
          !returnUrl.startsWith('/login') && !returnUrl.startsWith('/register')
          ? returnUrl : '/discover';
        void this.router.navigateByUrl(destination);
      },
      error: error => this.showToast(this.getErrorMessage(error), 'error'),
    });
  }

  logout(): void {
    this.auth.logout().subscribe(loggedOut => {
      if (!loggedOut) {
        this.showToast('ออกจากระบบไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง', 'error');
        return;
      }
      this.favoritesApi.clear();
      this.favoritesError = '';
      this.loadedFavoritesForUser = undefined;
      this.showToast('ออกจากระบบแล้ว');
      this.goHome();
    });
  }

  private navigateToSong(id: number, edit = false): void {
    this.selectedId = id;
    this.page = edit ? 'edit' : 'detail';
    void this.router.navigateByUrl(edit ? `/songs/${id}/edit` : `/songs/${id}`);
  }

  /* Keep selected list state when navigating into a song view. */
  private routeToHomeAfterDelete(): void {
    this.search = '';
    this.selectedGenres = [];
    this.go('home');
  }

  showDetail(id: number): void {
    if (!this.songs.some(song => song.id === id)) {
      this.showToast('ไม่พบข้อมูลเพลง');
      return;
    }

    this.navigateToSong(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startEdit(): void {
    const song = this.selectedSong;

    if (!song) {
      this.showToast('กรุณาเลือกเพลงก่อน');
      return;
    }

    this.editForm = {
      name: song.name,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      selectedGenres: song.genres,
      date: song.date,
      url: song.coverUrl ?? '',
      youtubeUrl: song.youtubeUrl ?? '',
      lyrics: song.lyrics ?? '',
    };

    this.go('edit');
  }

  // ใช้กับปุ่มแก้ไขบนการ์ดเพลง เพื่อเลือกเพลงก่อนเปิดฟอร์ม
  editSong(id: number): void {
    this.showDetail(id);

    if (this.selectedId === id) {
      this.startEdit();
    }
  }

  private validateSongForm(form: SongForm): string | null {
    if (!form.name.trim() || !form.artist.trim() || !form.album.trim() || !form.date) {
      return 'กรุณากรอกชื่อเพลง ศิลปิน อัลบั้ม และวันที่ให้ครบ';
    }

    if (this.page === 'add' && form.selectedGenres.length === 0) {
      return 'กรุณาเลือก Genre อย่างน้อยหนึ่งรายการ';
    }

    if (this.page === 'edit' && !form.selectedGenres.length && !form.genre.trim()) {
      return 'ค่า Genre เดิมว่าง กรุณาเลือก Genre อย่างน้อยหนึ่งรายการ';
    }

    if (this.page === 'edit' && this.selectedSong?.genres.length && !form.selectedGenres.length) {
      return 'กรุณาคง Genre ไว้อย่างน้อยหนึ่งรายการ';
    }

    if (form.name.trim().length > 200) {
      return 'ชื่อเพลงต้องไม่เกิน 200 ตัวอักษร';
    }

    if (form.artist.trim().length > 150) {
      return 'ชื่อศิลปินต้องไม่เกิน 150 ตัวอักษร';
    }

    if (form.album.trim().length > 200) {
      return 'ชื่ออัลบั้มต้องไม่เกิน 200 ตัวอักษร';
    }

    if (form.genre.trim().length > 100) {
      return 'แนวเพลงต้องไม่เกิน 100 ตัวอักษร';
    }

    if (!this.isValidDate(form.date)) {
      return 'วันที่ไม่ถูกต้อง กรุณาเลือกวันที่ใหม่';
    }

    if (form.date > this.getToday()) {
      return 'วันที่เผยแพร่ต้องไม่เป็นวันในอนาคต';
    }

    if (form.url.trim() && !this.isValidImageUrl(form.url.trim())) {
      return 'URL รูปปกต้องเป็นลิงก์ HTTP หรือ HTTPS ที่ถูกต้อง';
    }

    if (form.youtubeUrl.trim() && !this.extractYouTubeVideoId(form.youtubeUrl.trim())) {
      return this.tr('Enter a valid supported YouTube URL.');
    }

    if (form.lyrics.length > 50000) {
      return this.tr('Lyrics must be no longer than 50000 characters.');
    }

    return null;
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
      date.toISOString().substring(0, 10) === value;
  }

  private getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isValidImageUrl(value: string): boolean {
    try {
      const url = new URL(value);

      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        !!url.hostname &&
        !/\s/.test(value)
      );
    } catch {
      return false;
    }
  }

  // CREATE
  addSong(): void {
    if (this.savingAdd) return;

    const validationError = this.validateSongForm(this.addForm);

    if (validationError) {
      this.showToast(validationError, 'warning');
      return;
    }

    this.savingAdd = true;

    this.http.post<ApiSong>(
      this.apiUrl,
      this.getPayload(this.addForm),
      { withCredentials: true }
    )
      .pipe(
        timeout({ first: 15000 }),
        switchMap(createdSong => this.http.get<ApiSong[]>(this.apiUrl).pipe(
          timeout({ first: 15000 }),
          switchMap(songs => of({ createdSong, songs, refreshError: null as unknown | null })),
          catchError(refreshError => of({ createdSong, songs: null, refreshError }))
        )),
        finalize(() => {
          this.savingAdd = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ createdSong, songs, refreshError }) => {
          const savedSong = this.mapApiSong(createdSong);
          if (songs) {
            this.songs = songs.map((song, index) => this.mapApiSong(song, index));
            // Keep the POST-confirmed row visible if the list endpoint is briefly stale.
            if (!this.songs.some(song => song.id === savedSong.id)) this.songs = [savedSong, ...this.songs];
          } else {
            this.songs = [savedSong, ...this.songs.filter(song => song.id !== savedSong.id)];
            console.error('Song was saved, but refreshing GET /songs failed:', this.safeHttpError(refreshError));
          }
          this.selectedId = createdSong.id;
          this.addForm = this.emptyForm();
          this.search = '';
          this.selectedGenres = [];
          this.page = 'discover';
          void this.router.navigate(['/discover']);
          this.loadError = '';

          this.showToast(refreshError
            ? 'เพิ่มเพลงสำเร็จแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ เพลงที่บันทึกแสดงอยู่ด้านบน'
            : 'เพิ่มเพลงสำเร็จแล้ว!');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: error => {
          console.error('POST /songs failed:', this.safeHttpError(error));
          this.showToast(this.getErrorMessage(error), 'error');
        }
      });
  }

  private safeHttpError(error: unknown): { status: number; statusText: string } {
    if (error instanceof HttpErrorResponse) {
      return { status: error.status, statusText: error.statusText };
    }
    return { status: 0, statusText: 'Unknown error' };
  }

  // UPDATE
  saveEdit(): void {
    if (this.savingEdit) return;

    const song = this.selectedSong;

    if (!song) {
      this.showToast('ไม่พบเพลงที่ต้องการแก้ไข');
      return;
    }

    const validationError = this.validateSongForm(this.editForm);

    if (validationError) {
      this.showToast(validationError, 'warning');
      return;
    }

    this.savingEdit = true;

    this.http.put<ApiSong>(
      `${this.apiUrl}/${song.id}`,
      this.getPayload(this.editForm),
      { withCredentials: true }
    )
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.savingEdit = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: updatedSong => {
          const updated = this.mapApiSong(
            updatedSong,
            this.songs.findIndex(item => item.id === updatedSong.id)
          );

          this.songs = this.songs.map(item =>
            item.id === updated.id ? updated : item
          );

          this.selectedId = updated.id;
          this.navigateToSong(updated.id);
          this.loadError = '';

          this.showToast('แก้ไขเพลงสำเร็จแล้ว!');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: error => {
          console.error('PUT /songs failed:', this.safeHttpError(error));
          this.showToast(this.getErrorMessage(error), 'error');
        }
      });
  }

  // DELETE
  openDelete(): void {
    if (!this.selectedSong) {
      this.showToast('กรุณาเลือกเพลงก่อน');
      return;
    }

    this.deleteOpen = true;
  }

  closeDelete(): void {
    if (this.deletingSong) return;
    this.deleteOpen = false;
  }

  confirmDelete(): void {
    if (this.deletingSong) return;

    const song = this.selectedSong;

    if (!song) {
      this.deleteOpen = false;
      return;
    }

    this.deletingSong = true;

    this.http.delete(`${this.apiUrl}/${song.id}`, { withCredentials: true })
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.deletingSong = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.songs = this.songs.filter(item => item.id !== song.id);
          this.selectedId = this.songs[0]?.id ?? 0;

          this.deleteOpen = false;
          this.routeToHomeAfterDelete();
          this.loadError = '';

          this.showToast('ลบเพลงสำเร็จแล้ว!');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: error => {
          console.error('DELETE /songs failed:', this.safeHttpError(error));
          this.showToast(this.getErrorMessage(error), 'error');
        }
      });
  }

  showToast(
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'): void {
    this.toast = this.language.text(message);
    this.toastType = type;
    this.cdr.markForCheck();

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast = '';
      this.toastTimer = undefined;
      this.cdr.markForCheck();
    }, 3000);
  }
}

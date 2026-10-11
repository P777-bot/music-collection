import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService } from './auth.service';

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.match('http://localhost:3000/artists').forEach(request => request.flush([]));
    http.match('http://localhost:3000/auth/me').forEach(request => request.flush(null, { status: 401, statusText: 'Unauthorized' }));
    http.verify();
  });

  it('loads the collection from the API and renders the existing home design', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Discover Your');
    expect(compiled.querySelector('.home-search')).not.toBeNull();
  });

  it('shows songs returned by the backend', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([{
      id: 4,
      name: 'Test Song',
      album: 'Test Album',
      genre: 'Pop',
      releaseDate: '2024-05-10T00:00:00.000Z',
      coverUrl: null,
      artist: { id: 2, name: 'Test Artist' },
    }]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.navlinks button:nth-child(2)')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Test Song');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Test Artist');
  });

  it('loads real artist summaries and grouped album songs from the artist API', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    await TestBed.inject(Router).navigateByUrl('/artists');
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/artists').flush([
      { id: 3, name: 'BOWKYLION', songCount: 6, albumCount: 2 },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.page).toBe('artists');
    expect(fixture.componentInstance.artists[0]?.name).toBe('BOWKYLION');

    await TestBed.inject(Router).navigateByUrl('/artists/3');
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/artists/3').flush({
      id: 3,
      name: 'BOWKYLION',
      songCount: 2,
      albumCount: 1,
      albums: [{ name: 'CHERRY', songCount: 1, coverUrl: null, songs: [{
        id: 12, name: 'jasmine', album: 'CHERRY', genre: 'Pop', releaseDate: '2024-01-01T00:00:00.000Z',
        artistId: 3, artist: { id: 3, name: 'BOWKYLION' },
      }] }],
      unalbumedSongs: [{
        id: 13, name: 'Unalbumed', album: '   ', genre: 'Pop', releaseDate: '2024-01-01T00:00:00.000Z',
        artistId: 3, artist: { id: 3, name: 'BOWKYLION' },
      }],
      songs: [],
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app.artistDetail?.albumCount).toBe(1);
    expect(app.artistDetail?.albums[0].songs[0].name).toBe('jasmine');
    expect(app.artistDetail?.unalbumedSongs[0].name).toBe('Unalbumed');
  });

  it('accepts supported YouTube URL forms and rejects untrusted hosts', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.safeYouTubeWatchUrl('https://youtu.be/abcdefghijk')).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(app.safeYouTubeWatchUrl('https://www.youtube.com/shorts/abcdefghijk')).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(app.safeYouTubeWatchUrl('https://youtube.com.evil.invalid/watch?v=abcdefghijk')).toBeNull();
    expect(app.safeYouTubeWatchUrl('http://youtube.com/watch?v=abcdefghijk')).toBeNull();
  });

  it('shows the saved per-song YouTube link and preloads it into the authorized edit form', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([{
      id: 4, createdById: 7, name: 'Detail Song', album: 'Detail Album', genre: 'Pop',
      releaseDate: '2024-05-10T00:00:00.000Z', youtubeUrl: 'https://youtu.be/abcdefghijk',
      artist: { id: 2, name: 'Detail Artist' },
    }]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/songs/4');
    await fixture.whenStable();
    fixture.componentInstance.page = 'detail';
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.youtube-open-link');
    expect(link?.href).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');

    TestBed.inject(AuthService).user.set({
      id: 7, email: 'owner@example.test', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z',
    });
    fixture.componentInstance.startEdit();
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('http://localhost:3000/auth/me').flush({ user: {
      id: 7, email: 'owner@example.test', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z',
    } });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.editForm.youtubeUrl).toBe('https://youtu.be/abcdefghijk');
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#edit-youtube-url')?.value)
      .toBe('https://youtu.be/abcdefghijk');

  });

  it('keeps Home and Discover active states separate and routes Home search to Discover', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.navlinks button'));
    buttons[1].click();
    await fixture.whenStable();
    http.expectOne('http://localhost:3000/artists').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buttons[0].classList.contains('active')).toBe(false);
    expect(buttons[1].classList.contains('active')).toBe(true);

    buttons[0].click();
    await fixture.whenStable();
    fixture.detectChanges();
    const search = (fixture.nativeElement as HTMLElement).querySelector('.searchbox') as HTMLInputElement;
    search.value = 'blue moon';
    search.dispatchEvent(new Event('input'));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.home-search .primary')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toContain('/discover?q=blue%20moon');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Discover Music');
  });

  it('provides Login/Register pages and protects My Favorites routing', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.account-desktop button'));
    buttons.find(button => button.textContent?.trim() === 'Register')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Create Account');

    const router = TestBed.inject(Router);
    const navigation = router.navigateByUrl('/favorites');
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await navigation;
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toContain('/login');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Welcome Back');
  });

  it('keeps the authenticated session when the logout request fails', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    const auth = TestBed.inject(AuthService);
    auth.user.set({ id: 3, email: 'logout@example.test', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z' });
    const app = fixture.componentInstance;
    app.logout();

    const request = http.expectOne('http://localhost:3000/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ message: 'server error' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(auth.user()?.email).toBe('logout@example.test');
    expect(app.toastType).toBe('error');
    expect(app.toast).toContain('ออกจากระบบไม่สำเร็จ');
  });

  it('restores the session and redirects signed-in users away from Login', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush({ user: {
      id: 8, email: 'signed-in@example.test', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z',
    } });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/discover');
    expect(fixture.componentInstance.page).toBe('discover');
    http.expectOne('http://localhost:3000/artists').flush([]);
    await fixture.whenStable();
  });

  it('filters by multiple selected Genres using OR logic', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([
      { id: 1, name: 'Rock Song', album: 'A', genre: 'Rock', genres: [{ id: 2, name: 'Rock', parentId: null }], releaseDate: '2020-01-01', artist: { id: 1, name: 'Artist A' } },
      { id: 2, name: 'Jazz Song', album: 'B', genre: 'Jazz', genres: [{ id: 7, name: 'Jazz', parentId: null }], releaseDate: '2020-01-01', artist: { id: 2, name: 'Artist B' } },
      { id: 3, name: 'Pop Song', album: 'C', genre: 'Pop', genres: [{ id: 1, name: 'Pop', parentId: null }], releaseDate: '2020-01-01', artist: { id: 3, name: 'Artist C' } },
      { id: 4, name: 'Rap Song', album: 'D', genre: 'Hip-Hop / Rap', genres: [{ id: 4, name: 'Hip-Hop / Rap', parentId: null }], releaseDate: '2020-01-01', artist: { id: 4, name: 'Artist D' } },
    ]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();
    const app = fixture.componentInstance;
    app.toggleFilterGenre('Rock');
    app.toggleFilterGenre('Jazz');
    expect(app.visibleSongs.map(song => song.id)).toEqual([1, 2]);
    app.page = 'discover';
    app.selectedArtistId = 2;
    expect(app.visibleSongs.map(song => song.id)).toEqual([2]);
    app.selectedArtistId = null;
    app.toggleFilterGenre('Rock');
    expect(app.visibleSongs.map(song => song.id)).toEqual([2]);
    app.clearFilters();
    expect(app.visibleSongs.map(song => song.id)).toEqual([1, 2, 3, 4]);
    app.search = 'hip hop';
    expect(app.visibleSongs.map(song => song.id)).toEqual([4]);
  });

  it('sends Add Song credentials, refreshes from the API, clears filters, and navigates to Discover after saving', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    const app = fixture.componentInstance;
    TestBed.inject(AuthService).user.set({
      id: 17,
      email: 'add-song@example.test',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    app.page = 'add';
    app.addForm = {
      name: 'Verified Add Flow Song',
      artist: 'Verified Add Flow Artist',
      album: 'Verified Add Flow Album',
      genre: 'Pop',
      selectedGenres: ['Pop'],
      date: '2024-04-05',
      url: '',
      youtubeUrl: '',
      lyrics: '',
    };
    app.search = 'old search';
    app.selectedGenres = ['Rock'];

    app.addSong();
    const post = http.expectOne('http://localhost:3000/songs');
    expect(post.request.method).toBe('POST');
    expect(post.request.withCredentials).toBe(true);
    expect(post.request.body).toMatchObject({
      name: 'Verified Add Flow Song',
      artist: 'Verified Add Flow Artist',
      album: 'Verified Add Flow Album',
      genre: 'Pop',
      genres: ['Pop'],
      releaseDate: '2024-04-05',
      coverUrl: null,
      youtubeUrl: null,
      lyrics: null,
    });
    expect(app.savingAdd).toBe(true);

    const created = {
      id: 41,
      createdById: 17,
      name: 'Verified Add Flow Song',
      album: 'Verified Add Flow Album',
      genre: 'Pop',
      releaseDate: '2024-04-05T00:00:00.000Z',
      coverUrl: null,
      genres: [{ id: 1, name: 'Pop', parentId: null }],
      artist: { id: 22, name: 'Verified Add Flow Artist' },
    };
    post.flush(created);

    const refresh = http.expectOne('http://localhost:3000/songs');
    expect(refresh.request.method).toBe('GET');
    refresh.flush([created]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/discover');
    expect(app.page).toBe('discover');
    expect(app.songs.map(song => song.name)).toContain('Verified Add Flow Song');
    expect(app.search).toBe('');
    expect(app.selectedGenres).toEqual([]);
    expect(app.addForm.name).toBe('');
    expect(app.toast).toContain('เพิ่มเพลงสำเร็จ');
    expect(app.savingAdd).toBe(false);
    http.expectOne('http://localhost:3000/artists').flush([]);
    await fixture.whenStable();
  });

  it('keeps Add Song form values and stays on the form when POST fails', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    const app = fixture.componentInstance;
    app.language.set('th');
    TestBed.inject(AuthService).user.set({
      id: 17,
      email: 'add-song@example.test',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    app.page = 'add';
    app.addForm = {
      name: 'Form Must Be Preserved',
      artist: 'Artist',
      album: 'Album',
      genre: 'Pop',
      selectedGenres: ['Pop'],
      date: '2024-04-05',
      url: '',
      youtubeUrl: '',
      lyrics: '',
    };

    app.addSong();
    const post = http.expectOne('http://localhost:3000/songs');
    expect(post.request.withCredentials).toBe(true);
    post.flush({ message: 'Login is required.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(app.page).toBe('add');
    expect(app.addForm.name).toBe('Form Must Be Preserved');
    expect(app.toast).toContain('Session');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(app.savingAdd).toBe(false);
  });

  it('sends the authenticated session cookie for song updates and deletes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/songs').flush([{
      id: 4,
      createdById: 3,
      name: 'Owned Song',
      album: 'Owned Album',
      genre: 'Pop',
      genres: [{ id: 1, name: 'Pop', parentId: null }],
      releaseDate: '2024-05-10T00:00:00.000Z',
      coverUrl: null,
      artist: { id: 2, name: 'Owned Artist' },
    }]);
    http.expectOne('http://localhost:3000/genres').flush([]);
    await fixture.whenStable();

    const app = fixture.componentInstance;
    TestBed.inject(AuthService).user.set({
      id: 3,
      email: 'owner@example.test',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    app.page = 'edit';
    app.selectedId = 4;
    app.editForm = {
      name: 'Owned Song Updated',
      artist: 'Owned Artist',
      album: 'Owned Album',
      genre: 'Pop',
      selectedGenres: ['Pop'],
      date: '2024-05-10',
      url: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
      lyrics: '',
    };

    app.saveEdit();
    const update = http.expectOne('http://localhost:3000/songs/4');
    expect(update.request.method).toBe('PUT');
    expect(update.request.withCredentials).toBe(true);
    expect(update.request.body.youtubeUrl).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    update.flush({
      id: 4,
      createdById: 3,
      name: 'Owned Song Updated',
      album: 'Owned Album',
      genre: 'Pop',
      genres: [{ id: 1, name: 'Pop', parentId: null }],
      releaseDate: '2024-05-10T00:00:00.000Z',
      coverUrl: null,
      youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
      artist: { id: 2, name: 'Owned Artist' },
    });
    await fixture.whenStable();
    http.expectOne('http://localhost:3000/artists').flush([]);
    await fixture.whenStable();

    app.confirmDelete();
    const remove = http.expectOne('http://localhost:3000/songs/4');
    expect(remove.request.method).toBe('DELETE');
    expect(remove.request.withCredentials).toBe(true);
    remove.flush({ deleted: true, id: 4 });
    await fixture.whenStable();
    http.expectOne('http://localhost:3000/artists').flush([]);
    await fixture.whenStable();
    expect(app.page).toBe('home');
  });
});

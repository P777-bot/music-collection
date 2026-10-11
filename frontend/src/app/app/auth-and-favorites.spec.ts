import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { FavoritesService } from './favorites.service';

describe('Authentication and Favorites services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps the safe account state and uses credentialed cookie requests', () => {
    const auth = TestBed.inject(AuthService);
    let email = '';
    auth.login('listener@example.test', 'StrongPassword123').subscribe(user => email = user.email);
    const login = http.expectOne('http://localhost:3000/auth/login');
    expect(login.request.withCredentials).toBe(true);
    login.flush({ user: { id: 3, email: 'listener@example.test', role: 'USER', createdAt: '2026-01-01T00:00:00.000Z' } });
    expect(email).toBe('listener@example.test');
    expect(auth.user()?.email).toBe(email);

    auth.logout().subscribe();
    const logout = http.expectOne('http://localhost:3000/auth/logout');
    expect(logout.request.withCredentials).toBe(true);
    logout.flush({ loggedOut: true });
    expect(auth.user()).toBeNull();
  });

  it('updates Favorite state only after the real API succeeds', () => {
    const favorites = TestBed.inject(FavoritesService);
    favorites.load().subscribe();
    http.expectOne('http://localhost:3000/favorites').flush([]);

    favorites.add(12).subscribe();
    const add = http.expectOne('http://localhost:3000/favorites/12');
    expect(add.request.method).toBe('POST');
    expect(add.request.withCredentials).toBe(true);
    add.flush({ songId: 12, createdAt: '2026-01-01T00:00:00.000Z', song: {
      id: 12, name: 'Song', album: 'Album', genre: 'Pop', releaseDate: '2020-01-01',
      coverUrl: null, artist: { id: 1, name: 'Artist' },
    } });
    expect(favorites.songIds().has(12)).toBe(true);

    favorites.remove(12).subscribe();
    const remove = http.expectOne('http://localhost:3000/favorites/12');
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ songId: 12, favorited: false });
    expect(favorites.songIds().has(12)).toBe(false);
  });
});

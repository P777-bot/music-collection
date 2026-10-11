import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => localStorage.removeItem('music-collection-language'));

  it('switches language immediately and preserves canonical data values', () => {
    const language = new LanguageService();
    language.set('th');
    expect(language.text('Discover')).toBe('ค้นหาเพลง');
    expect(language.text('Song title saved by user')).toBe('Song title saved by user');
    language.set('en');
    expect(language.text('ค้นหาเพลง')).toBe('Discover');
  });

  it('persists the selected language for the next service instance', () => {
    const first = new LanguageService();
    first.set('th');
    expect(new LanguageService().language()).toBe('th');
  });

  it('translates API error messages in Thai and preserves them in English', () => {
    const language = new LanguageService();
    language.set('th');
    expect(language.text('Your session is missing or expired. Please log in.')).toBe('ไม่พบ Session หรือ Session หมดอายุ กรุณาเข้าสู่ระบบ');
    expect(language.text('You do not have permission to perform this action.')).toBe('บัญชีนี้ไม่มีสิทธิ์ดำเนินการดังกล่าว');
    language.set('en');
    expect(language.text('Your session is missing or expired. Please log in.')).toBe('Your session is missing or expired. Please log in.');
  });
});

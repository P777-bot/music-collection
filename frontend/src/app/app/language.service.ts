import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'th' | 'en';

const thai: Record<string, string> = {
  Home: 'หน้าหลัก', Discover: 'ค้นหาเพลง', 'My Favorites': 'เพลงโปรด', Login: 'เข้าสู่ระบบ',
  Register: 'สมัครสมาชิก', Logout: 'ออกจากระบบ', 'Add Song': 'เพิ่มเพลง', 'Add New Song': 'เพิ่มเพลงใหม่',
  'Edit Song': 'แก้ไขเพลง', 'Song Detail': 'รายละเอียดเพลง', 'Discover Music': 'ค้นพบเพลง',
  'Discover Your Music': 'ค้นพบเพลงที่ใช่', 'Explore music': 'เลือกดูเพลง', 'All Songs': 'เพลงทั้งหมด',
  'Favorite Songs': 'เพลงโปรด', 'No songs found.': 'ไม่พบเพลง', 'Clear Search & Filter': 'ล้างการค้นหาและตัวกรอง',
  'Clear filters': 'ล้างตัวกรอง', 'View Detail →': 'ดูรายละเอียด →', Album: 'อัลบั้ม', Artist: 'ศิลปิน',
  Genre: 'แนวเพลง', 'Release Date': 'วันที่เผยแพร่', 'Song Name *': 'ชื่อเพลง *', 'Artist *': 'ศิลปิน *',
  'Album *': 'อัลบั้ม *', 'Genre * เลือกได้หลายหมวด': 'แนวเพลง * เลือกได้หลายหมวด',
  'Genre · เลือกได้หลายหมวด': 'แนวเพลง · เลือกได้หลายหมวด', 'Create Account': 'สร้างบัญชี',
  'Welcome Back': 'ยินดีต้อนรับกลับ', 'Save your favorite songs to your account.': 'บันทึกเพลงโปรดไว้ในบัญชีของคุณ',
  'Log in to open your favorites.': 'เข้าสู่ระบบเพื่อดูเพลงโปรด', Password: 'รหัสผ่าน',
  'Confirm Password': 'ยืนยันรหัสผ่าน', Show: 'แสดง', Hide: 'ซ่อน', 'Please wait...': 'กำลังดำเนินการ...',
  'Save Changes': 'บันทึกการเปลี่ยนแปลง', Cancel: 'ยกเลิก', Delete: 'ลบ', 'Delete Song?': 'ลบเพลงนี้หรือไม่?',
  'Back to Discover': 'กลับไปหน้าค้นหาเพลง', 'No songs found': 'ไม่พบเพลง', 'Search songs, artists, albums...': 'ค้นหาเพลง ศิลปิน อัลบั้ม...',
  'Search music...': 'ค้นหาเพลง...', 'Cover Image URL (optional)': 'URL รูปปก (ไม่บังคับ)',
  'At least 15 characters, up to 128. No composition rules.': 'อย่างน้อย 15 ตัวอักษร สูงสุด 128 โดยไม่บังคับรูปแบบตัวอักษร',
  'No songs found for these filters.': 'ไม่พบเพลงจากตัวกรองนี้', 'songs': 'เพลง',
  'Loading songs...': 'กำลังโหลดเพลง...', 'Loading...': 'กำลังโหลด...', 'Try again': 'ลองอีกครั้ง',
  'No favorites yet': 'ยังไม่มีเพลงโปรด', 'Go to Discover': 'ไปหน้าค้นหาเพลง', 'Create a new item in your personal music collection.': 'เพิ่มรายการใหม่ในคลังเพลง',
  'Update the selected song.': 'แก้ไขข้อมูลเพลงที่เลือก', 'Welcome to Music Collection': 'ยินดีต้อนรับสู่ Music Collection',
  'Pop': 'ป๊อป', 'Rock': 'ร็อก', 'Alternative / Indie': 'อัลเทอร์เนทีฟ / อินดี้',
  'Hip-Hop / Rap': 'ฮิปฮอป / แร็ป', 'R&B / Soul': 'อาร์แอนด์บี / โซล', 'Electronic / Dance': 'อิเล็กทรอนิกส์ / แดนซ์',
  Jazz: 'แจ๊ส', Blues: 'บลูส์', Classical: 'คลาสสิก', Country: 'คันทรี', 'Folk / Traditional': 'โฟล์ก / ดั้งเดิม',
  'Reggae / Ska': 'เรกเก / สกา', Metal: 'เมทัล', Punk: 'พังก์', Latin: 'ละติน', 'Gospel / Religious': 'กอสเปล / ศาสนา',
  'Soundtrack / Score': 'เพลงประกอบ / สกอร์', 'World Music': 'เวิลด์มิวสิก', 'Experimental / Avant-Garde': 'ทดลอง / อาวองการ์ด',
  "Children's Music": 'เพลงเด็ก', 'Other / Unclassified': 'อื่น ๆ / ไม่จัดหมวด', 'Indie Pop': 'อินดี้ป๊อป', 'T-pop': 'ทีป๊อป', 'K-pop': 'เคป๊อป',
  Music: 'เสียงดนตรี', Genres: 'แนวเพลง', Search: 'ค้นหา', Edit: 'แก้ไข', Save: 'บันทึก',
  'Your Library': 'คลังเพลงของคุณ', 'Music Collection Account': 'บัญชี Music Collection',
  Email: 'อีเมล', 'Genre *': 'แนวเพลง *', 'Release Date *': 'วันที่เผยแพร่ *',
  'Adding...': 'กำลังเพิ่ม...', 'Saving...': 'กำลังบันทึก...',
  'Deleting...': 'กำลังลบ...', 'Remove Favorite': 'นำออกจากเพลงโปรด', 'Add Favorite': 'เพิ่มในเพลงโปรด',
  'Try changing your search or genre filter': 'ลองเปลี่ยนคำค้นหาหรือตัวกรองแนวเพลง',
  'Discover Your': 'ค้นพบ', 'Search music from Home': 'ค้นหาเพลงจากหน้าหลัก',
  'Search by song, artist, album or Genre': 'ค้นหาชื่อเพลง ศิลปิน อัลบั้ม หรือแนวเพลง',
  'Passwords do not match.': 'รหัสผ่านไม่ตรงกัน', 'Password must be at least 15 characters.': 'รหัสผ่านต้องมีอย่างน้อย 15 ตัวอักษร',
  'กรุณาเข้าสู่ระบบก่อนบันทึกเพลงโปรด': 'Please log in to save a favorite',
  'เพิ่มเพลงใน Favorites แล้ว': 'Added to Favorites', 'นำเพลงออกจาก Favorites แล้ว': 'Removed from Favorites',
  'สมัครสมาชิกสำเร็จ': 'Registration complete', 'เข้าสู่ระบบสำเร็จ': 'Login successful', 'ออกจากระบบแล้ว': 'Logged out',
  'เพิ่มเพลงสำเร็จแล้ว!': 'Song added successfully', 'แก้ไขเพลงสำเร็จแล้ว!': 'Song updated successfully',
  'ลบเพลงสำเร็จแล้ว!': 'Song deleted successfully', 'กรุณากรอกชื่อเพลง ศิลปิน อัลบั้ม และวันที่ให้ครบ': 'Enter the song, artist, album and release date',
  'กรุณาเลือก Genre อย่างน้อยหนึ่งรายการ': 'Select at least one Genre',
  'วันที่เผยแพร่ต้องไม่เป็นวันในอนาคต': 'Release date cannot be in the future',
  'URL รูปปกต้องเป็นลิงก์ HTTP หรือ HTTPS ที่ถูกต้อง': 'Cover URL must be a valid HTTP or HTTPS link',
  'ไม่พบข้อมูลเพลง': 'Song not found', 'กรุณาเลือกเพลงก่อน': 'Select a song first',
  'บัญชีนี้ไม่มีสิทธิ์ดำเนินการดังกล่าว': 'This account is not allowed to perform this action',
  'กรุณาเข้าสู่ระบบใหม่อีกครั้ง': 'Please log in again',
  'Filter by Genre': 'กรองตาม Genre', 'Retry Favorites': 'ลองโหลด Favorites อีกครั้ง',
  'No songs yet. Sign in to add the first song.': 'ยังไม่มีเพลงในระบบ เข้าสู่ระบบเพื่อเพิ่มเพลงแรก',
  'Cover for': 'ปกเพลง',
  'Unknown genre:': 'ไม่รู้จัก Genre:',
  'รหัสผ่านต้องมีอย่างน้อย 15 ตัวอักษร': 'Password must be at least 15 characters',
  'รหัสผ่านไม่ตรงกัน': 'Passwords do not match',
  'เชื่อมต่อ Backend ไม่ได้ ไม่สามารถ': 'Cannot connect to the Backend. Please check that NestJS is running.',
  'Main navigation': 'เมนูหลัก', 'Account menu': 'เมนูบัญชีผู้ใช้', 'Decorative vinyl record': 'ภาพแผ่นเสียงตกแต่ง',
  'Selected Genres': 'Genre ที่เลือก', 'Find your favorite songs, artists and albums.': 'ค้นหาเพลง ศิลปิน และอัลบั้มที่ชอบ',
  'Browse the library, search by artist or album, and save favorites to your account.': 'เลือกดูเพลง ค้นหาตามศิลปินหรืออัลบั้ม และบันทึกเพลงโปรดลงบัญชี',
  'Back to song list': 'กลับไปหน้ารายการเพลง', 'Enter a song name (up to 200 characters).': 'กรอกชื่อเพลง (ไม่เกิน 200 ตัวอักษร)',
  'Enter an artist name.': 'กรอกชื่อศิลปิน', 'Enter an album name.': 'กรอกชื่ออัลบั้ม',
  'Genre * Choose multiple': 'Genre * เลือกได้หลายหมวด', 'Genre · Choose multiple': 'Genre · เลือกได้หลายหมวด',
  'Select at least one Genre': 'เลือก Genre อย่างน้อยหนึ่งรายการ', 'Enter a cover image URL or leave it blank.': 'ใส่ URL รูปปกหรือเว้นว่างไว้',
  'Legacy Genre “': 'Genre เดิม “', '” has no standard match. Leave it unselected to keep the original value.': '” ยังไม่มีหมวดมาตรฐาน หากไม่เลือกจะเก็บค่าเดิมไว้',
  'Already have an account?': 'มีบัญชีแล้ว?', 'Need an account?': 'ยังไม่มีบัญชี?', 'Are you sure you want to delete': 'ยืนยันการลบเพลง',
  'Cannot connect to the backend. Check the network or CORS configuration.': 'เชื่อมต่อ Backend ไม่ได้ กรุณาตรวจสอบเครือข่ายหรือการตั้งค่า CORS',
  'The submitted data is invalid.': 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง',
  'Your session is missing or expired. Please log in.': 'ไม่พบ Session หรือ Session หมดอายุ กรุณาเข้าสู่ระบบ',
  'You do not have permission to perform this action.': 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการดังกล่าว',
  'The requested item was not found.': 'ไม่พบข้อมูลที่ต้องการ',
  'This conflicts with existing data.': 'ข้อมูลขัดแย้งหรือซ้ำกับข้อมูลที่มีอยู่',
  'This song already exists in the selected artist and album.': 'เพลงนี้มีอยู่แล้วในศิลปินและอัลบั้มที่เลือก',
  'The server could not complete this request.': 'เซิร์ฟเวอร์ไม่สามารถดำเนินการนี้ได้ กรุณาลองอีกครั้ง',
  'The request failed. Please try again.': 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง',
  Artists: 'ศิลปิน', 'Search artists': 'ค้นหาศิลปิน', 'Search artists...': 'ค้นหาศิลปิน...',
  'Loading artists...': 'กำลังโหลดรายชื่อศิลปิน...', 'Loading artist...': 'กำลังโหลดข้อมูลศิลปิน...',
  'No artists with songs yet.': 'ยังไม่มีศิลปินที่มีเพลงในระบบ', 'No artists found.': 'ไม่พบศิลปินที่ค้นหา',
  'Back to Artists': 'กลับไปหน้าศิลปิน', Albums: 'อัลบั้ม', 'Filter by album': 'กรองตามอัลบั้ม',
  'All songs': 'เพลงทั้งหมด', 'Unalbumed songs': 'เพลงที่ไม่มีอัลบั้ม', 'Artist not found.': 'ไม่พบศิลปิน',
  'No songs for this artist yet.': 'ยังไม่มีเพลงของศิลปินนี้', 'No songs in this album.': 'ไม่มีเพลงในอัลบั้มนี้',
  'Album cover': 'ปกอัลบั้ม', 'YouTube Player': 'เครื่องเล่น YouTube',
  'YouTube video for': 'วิดีโอ YouTube ของ', 'Open on YouTube': 'เปิดบน YouTube', Lyrics: 'เนื้อเพลง',
  'YouTube URL (optional)': 'ลิงก์ YouTube (ไม่บังคับ)',
  'YouTube watch, youtu.be, and Shorts links are supported.': 'รองรับลิงก์ YouTube watch, youtu.be และ Shorts',
  YouTube: 'YouTube', 'YouTube link': 'ลิงก์ YouTube',
  'No YouTube link is available for this song.': 'เพลงนี้ยังไม่มีลิงก์ YouTube',
  'Filter by Artist': 'กรองตามศิลปิน', 'All artists': 'ศิลปินทั้งหมด', albums: 'อัลบั้ม',
  'Lyrics (optional)': 'เนื้อเพลง (ไม่บังคับ)',
  'Only enter lyrics you have permission to publish.': 'กรอกเฉพาะเนื้อเพลงที่คุณมีสิทธิ์เผยแพร่',
  'Enter a valid supported YouTube URL.': 'กรุณากรอก URL YouTube ที่รองรับให้ถูกต้อง',
  'Lyrics must be no longer than 50000 characters.': 'เนื้อเพลงต้องมีความยาวไม่เกิน 50,000 ตัวอักษร',
};
const english = Object.fromEntries(Object.entries(thai).map(([source, translated]) => [translated, source]));

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<AppLanguage>(this.initialLanguage());

  private initialLanguage(): AppLanguage {
    try {
      const saved = localStorage.getItem('music-collection-language');
      if (saved === 'th' || saved === 'en') return saved;
      return navigator.language.toLowerCase().startsWith('th') ? 'th' : 'en';
    } catch {
      return 'en';
    }
  }

  set(language: AppLanguage): void {
    this.language.set(language);
    try { localStorage.setItem('music-collection-language', language); } catch { /* Storage may be disabled. */ }
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }

  toggle(): void { this.set(this.language() === 'en' ? 'th' : 'en'); }

  text(key: string): string {
    return this.language() === 'th' ? (thai[key] ?? key) : (english[key] ?? key);
  }
}

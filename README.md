# Music Collection

เว็บแอปสำหรับเก็บ ค้นหา และจัดการเพลง โดยอ่านและเขียนข้อมูลผ่าน Angular, NestJS, Prisma ORM และ PostgreSQL

## ฟีเจอร์

- แสดงรายการและรายละเอียดเพลงจาก REST API
- เพิ่ม แก้ไข และลบเพลง
- ค้นหาชื่อเพลง ศิลปิน อัลบั้ม และแนวเพลง พร้อมกรองตามแนวเพลง
- หน้า Home, Discover, Detail, Add และ Edit ใช้ Angular Router และรองรับ URL โดยตรง
- Home เป็นหน้าเริ่มต้น; Discover เป็นหน้ารายการ ค้นหา และกรอง Genre จาก API
- เลือกกรอง Genre ได้หลายรายการแบบ OR; Search ทำงานร่วมกับ Genre filters
- สมัครสมาชิก เข้าสู่ระบบ ออกจากระบบ และคงสถานะผู้ใช้ด้วย HttpOnly session cookie
- บันทึก Favorite ลงฐานข้อมูลจริงและแยกตามผู้ใช้; หน้า My Favorites ต้องเข้าสู่ระบบ
- แสดง Loading, Error, Empty State และข้อความแจ้งผลการบันทึก
- ค้นหาศิลปินและดูหน้าศิลปิน เพลง และอัลบั้ม โดยใช้ข้อมูล Artist/Song ที่มีอยู่
- จัดกลุ่มเพลงตามชื่ออัลบั้มที่เก็บใน `Song.album`; เพลงเดิมที่ไม่มี Album model ไม่ถูกย้ายหรือสร้างเป็นระเบียนซ้ำ
- เพิ่ม YouTube URL และ Lyrics แบบไม่บังคับใน Add/Edit และดู Player/เนื้อเพลงใน Song Detail

## เทคโนโลยีและโครงสร้างข้อมูล

- Frontend: Angular 22, TypeScript, CSS ??? Tailwind CSS 4.3.3 (????????? PostCSS ?????? utility classes ??? Header/Navigation)
- Backend: NestJS 12, REST API
- Database: PostgreSQL ผ่าน Prisma ORM 6
- `Artist` มีหลาย `Song`; แต่ละ `Song` มี `artistId` เป็น foreign key ไปยัง `Artist.id`
- ไม่มี `Album` model; API จัดกลุ่มอัลบั้มจากชื่อ `Song.album` แบบ exact match โดยไม่นำข้อมูลชื่อที่คล้ายกันมารวมเอง
- `Song.youtubeUrl` และ `Song.lyrics` เป็นฟิลด์ nullable; migration เพิ่มคอลัมน์ nullable จึงคงเพลงเดิมไว้
- `Genre` มีหมวดมาตรฐานและ alias; `SongGenre` เป็นตารางเชื่อม many-to-many และ `Genre.parentId` ระบุ Subgenre
- `Song.genre` เดิมยังคงเก็บข้อความต้นทางไว้ควบคู่กับ relation ใหม่ ค่าที่ไม่ชัดเจนจะไม่ถูกจับคู่โดยการคาดเดา
- ชื่อศิลปินไม่ซ้ำ (`Artist.name` มี unique constraint) และ API ใช้ `connectOrCreate` เพื่อเชื่อมศิลปินเดิมหรือสร้างเมื่อยังไม่มี
- `User` มีหลาย `Favorite`; `Favorite` เชื่อมหนึ่ง User กับหนึ่ง Song และมี composite primary key `(userId, songId)` ป้องกัน Favorite ซ้ำ
- `User.role` เป็น `USER` หรือ `ADMIN`; บัญชีสมัครใหม่ได้ `USER` เสมอ
- `Song.createdById` เป็นเจ้าของเพลงใหม่แบบ nullable; เพลงเดิมคงเป็น `NULL` จนกว่า Admin จะจัดการเป็นรายเพลง
- USER สร้างเพลงหลัง Login และแก้/ลบเฉพาะเพลงที่ตนเป็นเจ้าของ; ADMIN จัดการเพลงทั้งหมด รวมเพลงเก่าที่ไม่มีเจ้าของ
- User เก็บเฉพาะ password hash (scrypt); Password ไม่ถูกส่งกลับไปยัง Frontend
- สมัครบัญชีใหม่ต้องใช้ Password 15–128 ตัวอักษร; การ Login ยังรองรับรหัสผ่านบัญชีเดิมที่ยาวตั้งแต่ 8 ตัวอักษร
- Password policy อ้างอิง [NIST SP 800-63B Rev. 4](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/): ไม่บังคับ composition rules, เก็บ hash ด้วย scrypt และจำกัด failed login แบบ in-memory ต่อ process; ยังไม่ได้เชื่อม blocklist รหัสผ่านที่พบบ่อย/รั่วไหล

## ตั้งค่าและรันใน VS Code

ต้องมี Node.js/npm และ PostgreSQL ที่เข้าถึงได้จากเครื่องนี้

1. เปิดโฟลเดอร์หลักนี้ใน VS Code
2. เปิด Terminal แรกและไปที่ `backend`
3. กำหนดค่าในไฟล์ `backend/.env` (ไฟล์นี้ถูก ignore โดย Git) ให้ชี้ไปยัง PostgreSQL ของเครื่อง และกำหนด JWT secret แบบสุ่มอย่างน้อย 32 bytes ตัวอย่างเป็น placeholder เท่านั้น:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/music_collection?schema=public"
   JWT_SECRET="REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_BYTES"
   FRONTEND_ORIGIN="http://localhost:4200"
   ```

4. ติดตั้ง dependencies หากยังไม่มี และสร้าง Prisma Client:

   ```powershell
   cd backend
   npm.cmd install
   npx.cmd prisma generate
   ```

5. ตรวจการเชื่อมต่อและสถานะ migration ก่อนเริ่ม API:

   ```powershell
   npx.cmd prisma migrate status
   ```

   คำสั่งนี้ใช้ตรวจสถานะเท่านั้น หากแสดง migration ค้างหรือมี error ให้หยุดและตรวจฐานข้อมูล/สำรองข้อมูลก่อน ห้ามใช้ `prisma migrate reset` กับฐานข้อมูลที่มีข้อมูล

6. ใน Terminal แรก รัน Backend:

   ```powershell
   npm.cmd run start:dev
   ```

7. เปิด Terminal ที่สอง ไปที่ `frontend` แล้วติดตั้ง/รัน:

   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd start
   ```

8. เปิด `http://localhost:4200`; NestJS ใช้ `http://localhost:3000`

### การกำหนด Admin

สมัครบัญชีตามปกติก่อน จากนั้นผู้ดูแลระบบที่เข้าถึงเครื่องและฐานข้อมูลได้จึงรันคำสั่ง local ต่อไปนี้ โดยระบุ email เป้าหมายซ้ำเพื่อยืนยัน:

```powershell
cd backend
npm.cmd run promote-admin -- admin@example.test admin@example.test
```

คำสั่งตรวจว่าบัญชีมีอยู่จริงและต้องยืนยันแบบเจาะจง ไม่มี Public API สำหรับยกระดับ Role และข้อมูล `role` จาก Client ไม่มีผลต่อสิทธิ์ Backend

## Database และ Prisma อย่างปลอดภัย

- Schema ปัจจุบันอยู่ที่ `backend/prisma/schema.prisma`; migration history อยู่ที่ `backend/prisma/migrations/`
- Migration เก่าบางชุดมีคำสั่ง `DROP COLUMN` และเตือนว่าข้อมูลเดิมอาจสูญหาย จึงยังไม่ควรรัน migration ที่ค้างกับฐานข้อมูลที่มีข้อมูลโดยไม่ตรวจสถานะและทำ backup ก่อน
- migration `20261008120000_unique_song_per_album` เดิมไม่มีไฟล์ใน checkout; กู้คืนไฟล์จาก unique index ที่ตรวจพบในฐานข้อมูลก่อนเพิ่ม migration ใหม่ และตรวจ `migrate status`/apply migration เพิ่มเติมแล้ว
- Migration `20261011000000_add_auth_and_favorites` เพิ่มเฉพาะตาราง User/Favorite, indexes และ foreign keys; ไม่เปลี่ยนแถว Song/Artist ที่มีอยู่
- Migration `20261012000000_add_controlled_genres` เพิ่ม Genre, GenreAlias, SongGenre และ backfill link เฉพาะ genre เดิมที่ตรงกับชื่อ/alias ชัดเจน; คง `Song.genre` เดิมไว้ทุกแถว
- Migration `20261013000000_add_song_ownership_roles` เพิ่ม enum/role ที่ default เป็น USER, เพิ่ม `Song.createdById` แบบ nullable และ Relation แบบ `ON DELETE SET NULL`; เพลงเดิมไม่ถูกกำหนดเจ้าของ และเพิ่ม K-pop เป็น Subgenre ของ Pop โดยไม่แก้เพลงเดิม
- Migration `20261014000000_add_song_youtube_lyrics` เพิ่ม `Song.youtubeUrl` และ `Song.lyrics` แบบ nullable โดยไม่ลบหรือแก้ค่าข้อมูลเพลงเดิม
- อย่ารัน `prisma migrate reset` เพื่อแก้ปัญหาเฉพาะหน้า
- `backend/prisma/seed.ts` เรียก `deleteMany()` ก่อนใส่ข้อมูลตัวอย่าง จึงลบข้อมูลเพลงและศิลปินเดิมได้ ใช้ได้เฉพาะฐานข้อมูลทดลองที่ยอมลบข้อมูลได้เท่านั้น
- ห้ามใส่ `.env` หรือรหัสผ่านจริงใน README, source control หรือภาพหน้าจอ

## Deploy บน Render

โปรเจกต์นี้เป็น monorepo ให้สร้างบริการจาก Repository เดียวกัน:

### Backend — Render Web Service

- Root Directory: `backend`
- Build Command: `npm ci && npm run build:render` โดย script สร้าง Prisma Client ก่อน NestJS compile
- Start Command: `npm run start:prod`
- Environment Variables ใน Render Dashboard: `DATABASE_URL` (Internal Database URL ของ PostgreSQL), `JWT_SECRET` (ค่าสุ่มที่เป็นความลับ) และ `FRONTEND_ORIGIN` (Origin เต็มของ Static Site เช่น `https://ชื่อเว็บ.onrender.com`)
- Render กำหนด `PORT` ให้ Web Service; NestJS อ่าน `process.env.PORT` อยู่แล้ว อย่า commit ค่า PORT หรือ Secret ลง Source Code

### Frontend — Render Static Site

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build:render`
- Publish Directory: `dist/frontend/browser`
- Build Environment Variable: `API_BASE_URL` ต้องเป็น HTTPS URL ของ Backend Web Service เช่น `https://ชื่อ-api.onrender.com` โดยไม่ใส่ credentials หรือ Secret
- `build:render` เขียน `runtime-config.js` ลง Build Output จาก `API_BASE_URL`; URL นี้ไม่ใช่ Secret และไม่ถูกเขียนลง Source Code ส่วนการรันในเครื่องใช้ `http://localhost:3000` จาก Angular development environment
- ตั้งค่า SPA fallback/rewrite ของ Static Site ให้ route กลับไป `index.html` เพื่อรองรับ Angular Router เมื่อเปิด URL ภายในโดยตรง

### PostgreSQL และ Migrations

1. สร้าง PostgreSQL บน Render แล้วตั้ง `DATABASE_URL` ใน Backend Environment โดยใช้ connection string จาก Dashboard เท่านั้น
2. ตรวจฐานข้อมูลเป้าหมายและ migration history ก่อน deploy schema จากนั้นรัน `npm run prisma:migrate:deploy` ใน Backend Shell หรือ Pre-Deploy Command เมื่อยืนยันแล้วว่าฐานข้อมูลว่างและ migration history ถูกต้อง
3. ห้ามรัน `prisma migrate reset` หรือ `prisma/seed.ts` กับข้อมูลที่ต้องเก็บรักษา; Seed ปัจจุบันมี `deleteMany()`
4. Migration `20261007211747_init` ลบ `Song.artist` และเพิ่ม `artistId` แบบ required; `20261007221825_init` ลบ `title`, `createdAt`, `releaseYear`, `coverUrl` และเพิ่ม required fields; `20261008120000_unique_song_per_album` อาจล้มเหลวหากมีเพลงซ้ำใน Artist/Album เดียวกัน
5. Migration เก่าเหล่านี้อาจทำให้ข้อมูลสูญหายหรือล้มเหลวเมื่อ deploy ไปยังฐานข้อมูลที่มีข้อมูลแต่ไม่มี migration history ที่ตรงกัน สำหรับฐานข้อมูลเช่นนั้นให้หยุดและวางแผน baseline/ตรวจข้อมูลก่อน ห้ามปรับ migration เก่าหรือ deploy ต่อโดยคาดเดา

`npm run prisma:generate` และ `npm run build` ใช้ตรวจ/สร้าง artifacts โดยไม่แก้ข้อมูล DB; Render ใช้ `npm run build:render` เพื่อรันทั้งสองขั้นตอน ส่วน `npm run prisma:migrate:deploy` เปลี่ยน schema จริง ให้รันกับฐานข้อมูลเป้าหมายที่ตรวจสอบแล้วเท่านั้น

## API

Song endpoints ใช้ prefix `/songs`; response มี `artist` และ `genres` relation ส่วน `genre` ยังคงเป็นข้อความ legacy/ค่าหลักเพื่อรองรับ client เดิม.

| Method | Endpoint | การทำงาน |
|---|---|---|
| GET | `/songs` | อ่านรายการเพลงพร้อม Artist |
| GET | `/songs/:id` | อ่านเพลงหนึ่งรายการ; คืน 404 เมื่อไม่พบ |
| POST | `/songs` | เพิ่มเพลง (ต้อง Login; owner มาจาก session) |
| PUT | `/songs/:id` | แทนที่ข้อมูลเพลง (เจ้าของหรือ Admin เท่านั้น) |
| DELETE | `/songs/:id` | ลบเพลง (เจ้าของหรือ Admin เท่านั้น) |
| GET | `/genres` | อ่าน Genre มาตรฐานและความสัมพันธ์ Parent/Subgenre |
| GET | `/artists` | อ่านศิลปินที่มีเพลง พร้อมจำนวนเพลงและจำนวนชื่ออัลบั้มที่ไม่ซ้ำ |
| GET | `/artists/:id` | อ่านศิลปิน เพลงที่เกี่ยวข้อง และเพลงที่จัดกลุ่มตาม Album; คืน 404 เมื่อไม่พบศิลปินที่มีเพลง |
| POST | `/auth/register` | สมัครด้วย email/password 15–128 ตัวอักษร; email ซ้ำคืน 409 และตั้ง session cookie |
| POST | `/auth/login` | เข้าสู่ระบบ; credentials ไม่ถูกต้องคืน 401 |
| GET | `/auth/me` | อ่านผู้ใช้ปัจจุบันจาก session; ต้อง Login |
| POST | `/auth/logout` | ล้าง session cookie |
| GET | `/favorites` | อ่าน Favorite ของผู้ใช้ปัจจุบัน; ต้อง Login |
| POST | `/favorites/:songId` | เพิ่ม Favorite; ทำซ้ำได้แบบ idempotent; เพลงไม่มีคืน 404 |
| DELETE | `/favorites/:songId` | ลบ Favorite ของผู้ใช้ปัจจุบัน |

Authentication ใช้ JWT อายุ 8 ชั่วโมงใน cookie ที่ตั้ง `HttpOnly`, `SameSite=Lax` และเปิด `Secure` ใน production; CORS อนุญาต origin ที่กำหนดใน `FRONTEND_ORIGIN` เท่านั้น ค่าเริ่มต้นคือ `http://localhost:4200`.

ตัวอย่าง body สำหรับ POST/PUT (ส่ง cookie session สำหรับ POST/PUT/DELETE):

```json
{
  "name": "Song Name",
  "artist": "Artist Name",
  "album": "Album Name",
  "genre": "Pop",
  "genres": ["Pop", "Indie Pop"],
  "releaseDate": "2024-05-10",
  "coverUrl": "https://example.com/cover.jpg",
  "youtubeUrl": "https://www.youtube.com/watch?v=abcdefghijk",
  "lyrics": "Lyrics you have permission to publish"
}
```

`youtubeUrl` และ `lyrics` เป็น optional; YouTube URL ต้องเป็น HTTPS URL ที่รองรับจาก `youtube.com`, `youtu.be` หรือ `youtube.com/shorts` และ Player สร้าง Embed จาก Video ID ที่ตรวจสอบแล้วเท่านั้น ไม่ดึงเสียงหรือเนื้อเพลงจากเว็บไซต์ภายนอก

ทดสอบด้วย curl:

```sh
curl http://localhost:3000/songs
curl http://localhost:3000/songs/REPLACE_WITH_TEST_SONG_ID
curl -X POST -b cookies.txt http://localhost:3000/songs -H "Content-Type: application/json" -d '{"name":"Unique Test Song","artist":"Test Artist","album":"Unique Test Album","genre":"Pop","genres":["Pop","Indie Pop"],"releaseDate":"2024-05-10","coverUrl":null}'
curl -X PUT -b cookies.txt http://localhost:3000/songs/REPLACE_WITH_TEST_SONG_ID -H "Content-Type: application/json" -d '{"name":"Updated Test Song","artist":"Test Artist","album":"Unique Test Album","genre":"Pop","genres":["Pop","Rock"],"releaseDate":"2024-05-10","coverUrl":null}'
curl -X DELETE -b cookies.txt http://localhost:3000/songs/REPLACE_WITH_TEST_SONG_ID
```

ให้สร้างเพลงทดสอบด้วยชื่อ/อัลบั้มที่ไม่ซ้ำ แล้วแทน placeholder ด้วย ID ที่ API ส่งกลับมาเท่านั้น ตรวจ ID และข้อมูลก่อน PUT/DELETE ทุกครั้ง เพราะ API เปลี่ยนฐานข้อมูลจริง ห้ามใช้ ID ของเพลงเดิม

ตัวอย่างสมัครและใช้ session cookie ด้วย curl:

```sh
curl -i -c cookies.txt -H "Content-Type: application/json" -d '{"email":"listener@example.test","password":"A long unique passphrase 2026"}' http://localhost:3000/auth/register
curl -b cookies.txt http://localhost:3000/auth/me
curl -b cookies.txt http://localhost:3000/favorites
curl -X POST -b cookies.txt http://localhost:3000/favorites/REPLACE_WITH_TEST_SONG_ID
curl -X DELETE -b cookies.txt http://localhost:3000/favorites/REPLACE_WITH_TEST_SONG_ID
curl -X POST -b cookies.txt http://localhost:3000/auth/logout
```

ใช้ email สำหรับทดสอบที่ยังไม่เคยสมัคร และใช้ ID เพลงทดสอบเท่านั้น การสมัคร/เพิ่ม/ลบ Favorite เปลี่ยนฐานข้อมูลจริง

## Business Rules และ Validation

- ชื่อเพลง ศิลปิน อัลบั้ม และแนวเพลงห้ามว่าง; จำกัดความยาวตาม DTO
- `releaseDate` ต้องเป็นวันที่จริงรูปแบบ `YYYY-MM-DD` และห้ามเป็นวันในอนาคต
- `coverUrl` เว้นว่างได้; หากส่งมาต้องเป็น URL HTTP/HTTPS ที่ถูกต้อง
- ชื่อศิลปินมี unique constraint และใช้ซ้ำได้โดยเชื่อมกับ Artist เดิม
- ชื่อเพลงเดียวกันใน Artist และ Album เดียวกันซ้ำไม่ได้; API คืน 409
- เพลงเลือก Genre มาตรฐานได้ 1–8 หมวด; alias ที่ normalize แล้วซ้ำกันจะถูกปฏิเสธ และ `SongGenre` ป้องกัน Genre ซ้ำต่อเพลง
- `Indie Pop` และ `T-pop` เป็น Subgenre ที่ผูก Parent กับ `Alternative / Indie` และ `Pop` ตามลำดับ
- `/genres` ส่งรายการ Genre ที่ฟอร์มเลือกได้; API รับ canonical names หรือ alias ที่กำหนดไว้เท่านั้น ไม่รับ Genre อิสระที่ไม่รู้จัก
- Email ผู้ใช้ไม่ซ้ำ; สมัครใหม่ต้องมี Password 15–128 ตัวอักษร (Login บัญชีเดิมรองรับขั้นต่ำเดิม 8 ตัว); จำกัด login failure ไว้ 10 ครั้งต่อ email ภายใน 15 นาทีใน process ปัจจุบัน
- ผู้สมัครใหม่เป็น USER เสมอ; API ปฏิเสธ unauthenticated create และปฏิเสธการแก้/ลบเพลงนอกสิทธิ์ด้วย 401/403
- ลบ User หรือ Song จะลบเฉพาะ Favorite ที่ผูกกับ row นั้นผ่าน foreign key cascade
- Backend ตรวจ request body ก่อนเขียนข้อมูล; Frontend ตรวจฟอร์มซ้ำเพื่อแสดงข้อความช่วยผู้ใช้

## ข้อจำกัดก่อนส่ง

- Tailwind CSS 4.3.3 ??????????? `@tailwindcss/postcss` ?? `frontend/.postcssrc.json`; `frontend/src/styles.css` ???? Tailwind ???? CSS ???? ??? Header/Navigation ??? utility classes ?????? Keyboard Focus ?????????? CSS ????? Theme ??? Layout
- Login throttling เก็บสถานะใน memory ของ NestJS process จึงเหมาะกับ demo/local run; production ควรใช้ shared rate limiter และ blocklist ที่ดูแลอัปเดตได้
- ค่า Genre เดิมที่ยังจัดหมวดไม่ได้แน่ชัด เช่น `Rocx` และ `Pop Rock / String` คงไว้โดยไม่แก้เดา

## ตรวจสอบโปรเจกต์

รันแยกในโฟลเดอร์ `backend` และ `frontend`:

```powershell
# backend
cd backend
npm.cmd run build
npm.cmd test -- --runInBand

# frontend (อีก terminal)
cd frontend
npm.cmd run build
npm.cmd test -- --watch=false
```

## ข้อจำกัดที่ทราบ

- ยังไม่ได้ทดสอบหน้าจอด้วย Browser ที่ขนาด Desktop/Tablet/Mobile จริง; responsive ขณะนี้ตรวจจาก CSS และ Build เท่านั้น
- `Song.genre` เดิมยังอยู่เพื่อรักษาข้อมูลเดิม; ค่าที่ไม่ถูกจับคู่อัตโนมัติในฐานข้อมูลที่ตรวจพบคือ `Pop Rock / String`, `Rocx`, `test` และ `Thai Pop` ควรให้ผู้ดูแลข้อมูลจัดหมวด
- UI ??? Tailwind utility classes ?? Header/Navigation ??????? CSS ?????????? Theme, Layout ??? Vinyl animation
- Navigation ไม่มีหน้า About หรือ My Collection แยก: About เป็นข้อมูลทั่วไป และ My Collection เดิมชี้เฉพาะเพลงที่ถูกเลือก ไม่ได้แสดงรายการคอลเลกชันจริง
- migrations รุ่นเริ่มต้นมีคำเตือนเรื่องการลบคอลัมน์ หากสร้างฐานข้อมูลใหม่บนข้อมูลเดิม/นำไปใช้กับฐานข้อมูลอื่นให้ตรวจสถานะและสำรองข้อมูลก่อน
- migration unique song ที่กู้คืนได้อิง unique index ในฐานข้อมูลที่เชื่อมต่อ; ตรวจ checksum/history ของฐานข้อมูลเป้าหมายอื่นก่อน deploy
- README นี้ไม่ได้บรรจุรายชื่อสมาชิกกลุ่ม เนื่องจากไม่มีข้อมูลสมาชิกใน source ที่ตรวจพบ

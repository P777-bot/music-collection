import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ลบข้อมูลเก่าก่อน เพื่อให้ seed ซ้ำได้
  await prisma.song.deleteMany();
  await prisma.artist.deleteMany();

  // สร้างศิลปิน
  const fourEve = await prisma.artist.create({
    data: {
      name: '4eve',
    },
  });

  const purpeech = await prisma.artist.create({
    data: {
      name: 'PURPEECH',
    },
  });

  const bowkylion = await prisma.artist.create({
    data: {
      name: 'BOWKYLION',
    },
  });

  // เพิ่มเพลง
  await prisma.song.createMany({
    data: [
      {
        name: 'วันแรกของวันที่เหลือ',
        album: 'THE FIRST ALBUM',
        genre: 'T-pop',
        releaseDate: new Date('2021-03-28'),
        artistId: fourEve.id,
      },
      {
        name: 'วัดป่ะหล่ะ? (TEST ME)',
        album: 'THE FIRST ALBUM',
        genre: 'T-pop',
        releaseDate: new Date('2021-04-12'),
        artistId: fourEve.id,
      },
      {
        name: 'ON ONE',
        album: 'THE FIRST ALBUM',
        genre: 'T-pop',
        releaseDate: new Date('2021-04-25'),
        artistId: fourEve.id,
      },

      {
        name: 'ตอนนั้นในวันนี้',
        album: 'PurfectPeech',
        genre: 'Indie Pop',
        releaseDate: new Date('2025-02-21'),
        artistId: purpeech.id,
      },
      {
        name: 'หากจะเพียงขอ (Sincare)',
        album: 'PurfectPeech',
        genre: 'Indie Pop',
        releaseDate: new Date('2025-02-21'),
        artistId: purpeech.id,
      },
      {
        name: 'ทิ้งไว้อย่างพอใจ (Consoled)',
        album: 'PurfectPeech',
        genre: 'Indie Pop',
        releaseDate: new Date('2025-02-21'),
        artistId: purpeech.id,
      },

      {
        name: 'ลงใจ (longjai)',
        album: 'Lionheart',
        genre: 'Thai Pop',
        releaseDate: new Date('2019-11-18'),
        artistId: bowkylion.id,
      },
      {
        name: 'คงคา (still)',
        album: 'Lionheart',
        genre: 'Thai Pop',
        releaseDate: new Date('2020-06-12'),
        artistId: bowkylion.id,
      },
      {
        name: 'ยิ้มมา (Crush)',
        album: 'Lionheart',
        genre: 'Thai Pop',
        releaseDate: new Date('2020-08-06'),
        artistId: bowkylion.id,
      },
      {
        name: 'วิงวอน (ex-change)',
        album: 'CHERRY',
        genre: 'Pop',
        releaseDate: new Date('2024-11-19'),
        artistId: bowkylion.id,
      },
      {
        name: 'ส่วนต่าง (do it without me)',
        album: 'CHERRY',
        genre: 'Pop',
        releaseDate: new Date('2024-05-10'),
        artistId: bowkylion.id,
      },
      {
        name: 'ยิ้มลา (jasmine)',
        album: 'CHERRY',
        genre: 'Pop',
        releaseDate: new Date('2024-09-27'),
        artistId: bowkylion.id,
      },
    ],
  });

  console.log('เพิ่มข้อมูลเพลงเรียบร้อยแล้ว 🎵');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
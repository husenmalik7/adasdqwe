import { generateCells } from '@/lib/utils';

export const BOOTHS = [
  {
    cells: generateCells(438, 323, 446, 327),
    id: 7851,
    circle_code: 'AA-01/AA-02',
    name: 'Ichigowarano',
    circle_cut:
      'https://kumxjefxtrrpzalmwvvr.supabase.co/storage/v1/object/public/circle-cut-22/Ichigowarano.jpg',
    circle_facebook: null,
    circle_instagram: 'https://www.instagram.com/ichigowarano/',
    circle_twitter: 'https://x.com/ichigowarano',
    circle_other_socials: null,
    sampleworks_images: null,
    day: 'SAT',
    circle_type: 'Booth_B',
  },
  {
    cells: [
      { x: 10, y: 10 },
      { x: 9, y: 9 },
      { x: 9, y: 10 },
      { x: 10, y: 9 },
    ],
    id: 7852,

    circle_code: 'AA-03',
    name: 'soykune',
    circle_cut:
      'https://kumxjefxtrrpzalmwvvr.supabase.co/storage/v1/object/public/circle-cut-22/soykune.jpg',

    circle_facebook: null,
    circle_instagram: 'https://www.instagram.com/sonnya_ws/',
    circle_twitter: null,
    circle_other_socials: null,

    sampleworks_images: null,
    day: 'Both Days',

    circle_type: 'Booth_A',
  },
];

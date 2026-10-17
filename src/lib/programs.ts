export type ProgramGun = {
  bolge: string;
  hareketler: string[];
  sureDk: number;
};

export type Program = {
  id: string;
  ad: string;
  ozet: string;
  gunler: ProgramGun[];
};

export const PROGRAMLAR: Program[] = [
  {
    id: "5_gun",
    ad: "5 gün, bölünmüş",
    ozet: "Salon. Her gün tek bölge.",
    gunler: [
      {
        bolge: "Pazartesi — Göğüs",
        hareketler: ["Flat dumbbell press 4×10", "Incline press 4×10", "Cable fly 4×12"],
        sureDk: 55,
      },
      {
        bolge: "Salı — Sırt",
        hareketler: ["Lat pulldown 4×10", "Seated cable row 4×10", "Face pull 4×15"],
        sureDk: 55,
      },
      {
        bolge: "Perşembe — Omuz",
        hareketler: ["Overhead press 4×10", "Lateral raise 5×15", "Shrugs 4×15"],
        sureDk: 50,
      },
      {
        bolge: "Cuma — Bacak",
        hareketler: ["Leg press 4×10", "Romanian deadlift 4×10", "Leg extension 4×12"],
        sureDk: 60,
      },
      {
        bolge: "Cumartesi — Kol",
        hareketler: ["Barbell curl 4×10", "Triceps pushdown 4×12", "20 dk koşu"],
        sureDk: 50,
      },
    ],
  },
  {
    id: "fullbody",
    ad: "3 gün, tüm vücut",
    ozet: "Haftada üç seans. Her seansta tüm vücut.",
    gunler: [
      {
        bolge: "1. gün — Tüm vücut A",
        hareketler: ["Goblet squat 4×10", "Bench press 4×10", "Lat pulldown 4×10", "Plank 3×60 sn"],
        sureDk: 50,
      },
      {
        bolge: "2. gün — Tüm vücut B",
        hareketler: ["Romanian deadlift 4×10", "Overhead press 4×10", "Seated row 4×10", "Biceps curl 3×12"],
        sureDk: 50,
      },
      {
        bolge: "3. gün — Tüm vücut C",
        hareketler: ["Leg press 4×12", "Incline dumbbell press 4×10", "Lat pulldown 3×max", "Triceps pushdown 3×12"],
        sureDk: 55,
      },
    ],
  },
  {
    id: "hiit",
    ad: "Yağ yakımı",
    ozet: "Kısa seans. Tempo yüksek, süre düşük.",
    gunler: [
      {
        bolge: "Pazartesi — Üst vücut",
        hareketler: ["Dumbbell thruster 4×12", "Şınav 4×15", "Mountain climber 4×45 sn"],
        sureDk: 45,
      },
      {
        bolge: "Çarşamba — Alt vücut",
        hareketler: ["Bulgarian split squat 3×10", "Kettlebell swing 4×15", "Bicycle crunch 3×20"],
        sureDk: 45,
      },
      {
        bolge: "Cuma — Kondisyon",
        hareketler: ["30 dk tempolu yürüyüş veya ip", "Burpee 4×8"],
        sureDk: 40,
      },
    ],
  },
  {
    id: "ev",
    ad: "Evde",
    ozet: "Ağırlık yok. Vücut ağırlığı ve bant.",
    gunler: [
      {
        bolge: "1. gün — İtme ve çekme",
        hareketler: ["Pike push-up 4×10", "Band row 4×12", "Air squat 4×20"],
        sureDk: 40,
      },
      {
        bolge: "2. gün — Core",
        hareketler: ["Plank 3×60 sn", "Leg raise 3×15", "Russian twist 3×30"],
        sureDk: 35,
      },
      {
        bolge: "3. gün — Bacak",
        hareketler: ["Glute bridge 4×15", "Lunge 3×12", "Calf raise 4×20"],
        sureDk: 40,
      },
    ],
  },
];
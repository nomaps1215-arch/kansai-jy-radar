import { PrismaClient, TeamCategory } from "@prisma/client";

const prisma = new PrismaClient();

const sampleTeams = [
  // 大阪府
  {
    name: "セレッソ大阪U-15",
    nameKana: "セレッソオオサカアンダーフィフティーン",
    prefecture: "大阪府",
    city: "大阪市",
    category: "J_YOUTH" as TeamCategory,
    league: "高円宮杯U-15プリンスリーグ関西",
    officialSiteUrl: "https://www.cerezo.co.jp",
  },
  {
    name: "ガンバ大阪ジュニアユース",
    nameKana: "ガンバオオサカジュニアユース",
    prefecture: "大阪府",
    city: "吹田市",
    category: "J_YOUTH" as TeamCategory,
    league: "高円宮杯U-15プリンスリーグ関西",
    officialSiteUrl: "https://www.gamba-osaka.net",
  },
  {
    name: "FCリップエース",
    nameKana: "エフシーリップエース",
    prefecture: "大阪府",
    city: "大阪市",
    category: "CLUB" as TeamCategory,
    league: "高円宮杯U-15関西リーグ",
  },
  {
    name: "センアーノ神戸ジュニアユース",
    nameKana: "センアーノコウベジュニアユース",
    prefecture: "兵庫県",
    city: "神戸市",
    category: "CLUB" as TeamCategory,
    league: "高円宮杯U-15プリンスリーグ関西",
  },
  // 兵庫県
  {
    name: "ヴィッセル神戸U-15",
    nameKana: "ヴィッセルコウベアンダーフィフティーン",
    prefecture: "兵庫県",
    city: "神戸市",
    category: "J_YOUTH" as TeamCategory,
    league: "高円宮杯U-15プリンスリーグ関西",
    officialSiteUrl: "https://www.vissel-kobe.co.jp",
  },
  // 京都府
  {
    name: "京都サンガF.C.U-15",
    nameKana: "キョウトサンガエフシーアンダーフィフティーン",
    prefecture: "京都府",
    city: "京都市",
    category: "J_YOUTH" as TeamCategory,
    league: "高円宮杯U-15プリンスリーグ関西",
    officialSiteUrl: "https://www.sanga-fc.jp",
  },
  // 奈良県
  {
    name: "奈良クラブU-15",
    nameKana: "ナラクラブアンダーフィフティーン",
    prefecture: "奈良県",
    city: "奈良市",
    category: "J_YOUTH" as TeamCategory,
    league: "高円宮杯U-15関西リーグ",
  },
  // 滋賀県
  {
    name: "レイラック滋賀U-15",
    nameKana: "レイラックシガアンダーフィフティーン",
    prefecture: "滋賀県",
    city: "草津市",
    category: "J_YOUTH" as TeamCategory,
    league: "高円宮杯U-15関西リーグ",
  },
  // 和歌山県
  {
    name: "VEERTIEN FC和歌山",
    nameKana: "フェルティーンエフシーワカヤマ",
    prefecture: "和歌山県",
    city: "和歌山市",
    category: "CLUB" as TeamCategory,
    league: "高円宮杯U-15関西リーグ",
  },
];

async function main() {
  console.log("🌱 シードデータを投入中...");

  for (const team of sampleTeams) {
    const existing = await prisma.team.findFirst({
      where: { name: team.name, prefecture: team.prefecture },
    });

    if (!existing) {
      await prisma.team.create({ data: team });
      console.log(`  ✓ ${team.name} (${team.prefecture})`);
    } else {
      console.log(`  - スキップ: ${team.name} (${team.prefecture}) 既に存在`);
    }
  }

  console.log("✅ シード完了");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

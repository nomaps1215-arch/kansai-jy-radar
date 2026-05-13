export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TeamCategory } from "@prisma/client";

const CATEGORY_MAP: Record<string, TeamCategory> = {
  "J下部": "J_YOUTH",
  j_youth: "J_YOUTH",
  J_YOUTH: "J_YOUTH",
  街クラブ: "CLUB",
  CLUB: "CLUB",
  club: "CLUB",
  スクール母体: "SCHOOL",
  SCHOOL: "SCHOOL",
  school: "SCHOOL",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clearFirst = formData.get("clearFirst") === "true";

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "データが見つかりません" }, { status: 400 });
    }

    // 一新モード: 既存チームを全削除（関連データはCascadeで自動削除）
    let deleted = 0;
    if (clearFirst) {
      const del = await prisma.team.deleteMany({});
      deleted = del.count;
    }

    const results = { deleted, created: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      const name = row["name"]?.trim();
      const prefecture = row["prefecture"]?.trim();

      if (!name || !prefecture) {
        results.errors.push(`スキップ: name/prefectureが空 (${JSON.stringify(row)})`);
        results.skipped++;
        continue;
      }

      try {
        await prisma.team.create({
          data: {
            name,
            nameKana: row["name_kana"] || null,
            prefecture,
            city: row["city"] || null,
            category: CATEGORY_MAP[row["category"] ?? ""] ?? "CLUB",
            league: row["league"] || null,
            trainingArea: row["training_area"] || null,
            homeGround: row["home_ground"] || null,
            officialSiteUrl: row["official_site_url"] || null,
            instagramUrl: row["instagram_url"] || null,
            xUrl: row["x_url"] || null,
            facebookUrl: row["facebook_url"] || null,
            memo: row["memo"] || null,
          },
        });
        results.created++;
      } catch (err) {
        results.errors.push(`エラー: ${name} - ${String(err)}`);
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[POST /api/teams/import]", error);
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 });
  }
}

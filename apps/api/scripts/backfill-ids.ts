/**
 * One-off script: assign key to existing projects and number to existing tasks.
 * Run with: npx tsx scripts/backfill-ids.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function deriveKey(name: string): string {
  const letterWords = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean);

  if (letterWords.length === 0) return 'PROJ';
  if (letterWords.length === 1) return letterWords[0].slice(0, 4).toUpperCase();

  const initials = letterWords.map((w) => w[0]).join('').slice(0, 5);
  return (initials.length >= 2 ? initials : letterWords[0].slice(0, 4)).toUpperCase();
}

async function resolveUniqueKey(
  organizationId: string,
  base: string,
  excludeProjectId: string,
  taken: Set<string>,
): Promise<string> {
  for (let i = 0; i <= 99; i++) {
    const candidate = i === 0 ? base : base.slice(0, 4) + i;
    if (!taken.has(`${organizationId}:${candidate}`)) return candidate;
  }
  return base + Date.now().toString().slice(-3);
}

async function main() {
  // ── 1. Backfill project keys ──────────────────────────────────────────────

  const projects = await prisma.project.findMany({
    where: { key: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, organizationId: true, name: true },
  });

  console.log(`Found ${projects.length} project(s) without a key.`);

  // Track keys already assigned (existing + newly assigned this run)
  const existingKeys = await prisma.project.findMany({
    where: { key: { not: null } },
    select: { organizationId: true, key: true },
  });
  const takenKeys = new Set(existingKeys.map((p) => `${p.organizationId}:${p.key}`));

  for (const project of projects) {
    const base = deriveKey(project.name);
    const key = await resolveUniqueKey(project.organizationId, base, project.id, takenKeys);
    await prisma.project.update({ where: { id: project.id }, data: { key } });
    takenKeys.add(`${project.organizationId}:${key}`);
    console.log(`  Project "${project.name}" → ${key}`);
  }

  // ── 2. Backfill task numbers ──────────────────────────────────────────────

  const projectsWithTasks = await prisma.project.findMany({
    select: { id: true, key: true, name: true },
    where: { tasks: { some: { number: null } } },
  });

  console.log(`\nFound ${projectsWithTasks.length} project(s) with unnumbered tasks.`);

  for (const project of projectsWithTasks) {
    // Get the current max number already assigned in this project
    const maxResult = await prisma.task.aggregate({
      where: { projectId: project.id, number: { not: null } },
      _max: { number: true },
    });
    let counter = maxResult._max.number ?? 0;

    // Assign numbers to tasks without one, ordered by creation time
    const unnumbered = await prisma.task.findMany({
      where: { projectId: project.id, number: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true },
    });

    for (const task of unnumbered) {
      counter += 1;
      await prisma.task.update({ where: { id: task.id }, data: { number: counter } });
      const key = project.key ?? '???';
      console.log(`  [${key}-${String(counter).padStart(3, '0')}] ${task.title}`);
    }
  }

  console.log('\nBackfill complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

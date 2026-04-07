import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("Starting workspace migration...");

  // 1. Find the existing workspace
  const workspace = await prisma.workspace.findFirst({
    include: { members: true, boards: true },
  });

  if (!workspace) {
    console.error("No workspace found!");
    process.exit(1);
  }

  console.log(`Found workspace: "${workspace.name}" (${workspace.id})`);
  console.log(`Members: ${workspace.members.length}`);
  console.log(`Boards: ${workspace.boards.length}`);

  // 2. Find the owner user (andrey@redking.co)
  const owner = await prisma.user.findUnique({
    where: { email: "andrey@redking.co" },
  });

  if (!owner) {
    console.error("Owner user andrey@redking.co not found!");
    process.exit(1);
  }

  console.log(`Found owner: ${owner.name} (${owner.id})`);

  // 3. Set slug and ownerId on the workspace
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      slug: "redking",
      ownerId: owner.id,
    },
  });

  console.log("Updated workspace with slug='redking' and ownerId");

  // 4. Create WorkspaceMember records for every user in the workspace
  const members = workspace.members;
  let memberCount = 0;

  for (const member of members) {
    const role = member.email === "andrey@redking.co" ? "owner" : "member";
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: member.id,
        },
      },
      update: { role },
      create: {
        workspaceId: workspace.id,
        userId: member.id,
        role,
      },
    });
    memberCount++;
    console.log(`  WorkspaceMember: ${member.name} (${member.email}) -> ${role}`);
  }

  console.log(`Created ${memberCount} WorkspaceMember records`);

  // 5. Create BoardShare for each board × each user with role "editor"
  let shareCount = 0;

  for (const board of workspace.boards) {
    for (const member of members) {
      await prisma.boardShare.upsert({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: member.id,
          },
        },
        update: { role: "editor" },
        create: {
          boardId: board.id,
          userId: member.id,
          role: "editor",
          sharedBy: owner.id,
        },
      });
      shareCount++;
    }
    console.log(`  BoardShare: ${board.name} -> ${members.length} users`);
  }

  console.log(`Created ${shareCount} BoardShare records`);
  console.log("Workspace migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

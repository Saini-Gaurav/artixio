import { PrismaClient, ActionItemStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { normalizeDirective, normalizePriority } from "../src/utils/normalizeRegulatoryData";

const prisma = new PrismaClient();

const AUTHORITIES = [
  { name: "U.S. Food and Drug Administration", code: "FDA", country: "United States", websiteUrl: "https://www.fda.gov" },
  { name: "European Medicines Agency", code: "EMA", country: "European Union", websiteUrl: "https://www.ema.europa.eu" },
  { name: "Medicines and Healthcare products Regulatory Agency", code: "MHRA", country: "United Kingdom", websiteUrl: "https://www.gov.uk/mhra" },
  { name: "Central Drugs Standard Control Organisation", code: "CDSCO", country: "India", websiteUrl: "https://cdsco.gov.in" },
  { name: "Pharmaceuticals and Medical Devices Agency", code: "PMDA", country: "Japan", websiteUrl: "https://www.pmda.go.jp" },
];

// Hand-picked directives that hit every edge case the assignment asks for, on top of whatever faker generates below. Kept explicit and separate from the bulk-generated batch so they're easy to point to in the walkthrough.
const MESSY_DIRECTIVE_SEEDS = [
  {
    referenceCode: "FDA-2024-0091",
    title: "Updated labeling requirements for biosimilar injectables",
    summary: "Revises labeling language for biosimilar products administered via injection.",
    rawStatus: "Active",
    severity: "High",
    publishedDate: new Date("2024-03-11"),
    effectiveDate: new Date("2024-06-01"),
  },
  {
    referenceCode: "EMA-2024-0042",
    title: "Guidance on nitrosamine impurity limits",
    summary: "Sets revised acceptable intake limits for nitrosamine impurities in oral medicines.",
    rawStatus: "actve", // typo, still recoverable via alias map
    severity: "critical",
    publishedDate: new Date("2024-01-20"),
    effectiveDate: new Date("2024-02-15"),
  },
  {
    referenceCode: "MHRA-2024-0017",
    title: "Post-Brexit conformity marking transition update",
    summary: "",
    rawStatus: "N/A", // unrecognized on purpose
    severity: "unknown", // unrecognized on purpose
    publishedDate: null,
    effectiveDate: null,
  },
  {
    referenceCode: "CDSCO-2024-0063",
    title: "Revised stability testing zones for tropical climates",
    summary: "Updates climatic zone classification used for shelf-life studies.",
    rawStatus: "Withdrawn",
    severity: "medium",
    publishedDate: new Date("2024-05-01"),
    effectiveDate: new Date("2024-04-01"), // effectiveDate before publishedDate on purpose
  },
  {
    referenceCode: "PMDA-2024-0028",
    title: "",
    summary: "Malformed record missing a title entirely - simulates a corrupted feed entry.",
    rawStatus: "Draft",
    severity: "low",
    publishedDate: new Date("2024-02-10"),
    effectiveDate: undefined,
  },
];

function randomAllowedStatus() {
  return faker.helpers.arrayElement(["Active", "Superseded", "Withdrawn", "Draft"]);
}

function randomAllowedSeverity() {
  return faker.helpers.arrayElement(["Low", "Medium", "High", "Critical"]);
}

function randomPriority(): string {
  // ~20% chance of a garbage priority value to keep the flagged-item ratio visible in the UI
  if (faker.number.int({ min: 1, max: 5 }) === 1) {
    return faker.helpers.arrayElement(["urgent!!", "asap", "", "tbd", "n/a"]);
  }
  return faker.helpers.arrayElement(["Low", "Medium", "High", "Critical"]);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.actionItem.deleteMany();
  await prisma.complianceDirective.deleteMany();
  await prisma.regulatoryAuthority.deleteMany();

  console.log("Seeding authorities...");
  const authorities = await Promise.all(
    AUTHORITIES.map((a) => prisma.regulatoryAuthority.create({ data: a }))
  );

  console.log("Seeding hand-picked messy directives...");
  const messyDirectives = [];
  for (let i = 0; i < MESSY_DIRECTIVE_SEEDS.length; i++) {
    const seed = MESSY_DIRECTIVE_SEEDS[i];
    const authority = authorities[i % authorities.length];

    const { isCorrupt, corruptReason } = normalizeDirective({
      rawStatus: seed.rawStatus,
      severity: seed.severity,
      publishedDate: seed.publishedDate ?? null,
      effectiveDate: seed.effectiveDate ?? null,
    });

    const directive = await prisma.complianceDirective.create({
      data: {
        authorityId: authority.id,
        referenceCode: seed.referenceCode,
        title: seed.title || "(untitled directive)",
        summary: seed.summary,
        rawStatus: seed.rawStatus,
        severity: seed.severity,
        publishedDate: seed.publishedDate,
        effectiveDate: seed.effectiveDate,
        isCorrupt,
        corruptReason,
      },
    });
    messyDirectives.push(directive);
  }

  console.log("Seeding bulk generated directives...");
  const bulkDirectives = [];
  for (let i = 0; i < 25; i++) {
    const authority = faker.helpers.arrayElement(authorities);
    const rawStatus = randomAllowedStatus();
    const severity = randomAllowedSeverity();
    const publishedDate = faker.datatype.boolean({ probability: 0.85 })
      ? faker.date.past({ years: 2 })
      : null;
    const effectiveDate = publishedDate
      ? faker.date.soon({ days: 90, refDate: publishedDate })
      : null;

    const { isCorrupt, corruptReason } = normalizeDirective({
      rawStatus,
      severity,
      publishedDate,
      effectiveDate,
    });

    const directive = await prisma.complianceDirective.create({
      data: {
        authorityId: authority.id,
        referenceCode: `${authority.code}-2024-${faker.string.numeric(4)}`,
        title: faker.company.catchPhrase() + " compliance update",
        summary: faker.lorem.sentence(),
        rawStatus,
        severity,
        publishedDate,
        effectiveDate,
        isCorrupt,
        corruptReason,
      },
    });
    bulkDirectives.push(directive);
  }

  const allDirectives = [...messyDirectives, ...bulkDirectives];

  console.log("Seeding action items...");
  const statuses: ActionItemStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED", "BLOCKED"];

  for (const directive of allDirectives) {
    const itemCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < itemCount; j++) {
      const priority = randomPriority();
      const { isFlagged, flagReason } = normalizePriority(priority);

      await prisma.actionItem.create({
        data: {
          directiveId: directive.id,
          title: faker.hacker.phrase(),
          description: faker.lorem.sentence(),
          assignee: faker.person.fullName(),
          status: faker.helpers.arrayElement(statuses),
          priority,
          dueDate: faker.datatype.boolean({ probability: 0.8 })
            ? faker.date.soon({ days: 60 })
            : null,
          isFlagged,
          flagReason,
        },
      });
    }
  }

  console.log(`Done. Seeded ${authorities.length} authorities, ${allDirectives.length} directives.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

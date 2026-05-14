/**
 * Creator metadata for project attribution, metadata, and signatures.
 */

export const CREATOR = {
  name: "Godstime Aburu",
  alias: "Golden Masathy",
  role: "Frontend Developer & Technical Writer",
  location: "Port Harcourt, Nigeria",
  github: "https://github.com/BboyGT",
  bylines: ["Godstime Aburu", "Golden Masathy"],
  publications: ["Smashing Magazine", "CSS-Tricks", "SitePoint", "PHP Architect", "Open Replay"],
  stack: ["React", "Next.js", "TypeScript", "Node.js", "PHP/Laravel", "Rust", "Three.js"],
  signature: "Built by Godstime Aburu",
  shortSignature: "GTA",
  year: new Date().getFullYear(),
} as const;

export const copyright = (projectName?: string) =>
  `Copyright ${CREATOR.year} ${CREATOR.name}${projectName ? ` - ${projectName}` : ""}`;

export const attribution = (projectName: string) =>
  `${projectName} - designed and built by ${CREATOR.name} (${CREATOR.alias})`;

import { $ } from "bun";

// Define the targets we want to build for
const ALL_TARGETS = [
  { name: "linux-x64", target: "bun-linux-x64", suffix: "" },
  { name: "windows-x64", target: "bun-windows-x64", suffix: ".exe" },
  { name: "macos-x64", target: "bun-darwin-x64", suffix: "" },
  { name: "macos-arm64", target: "bun-darwin-arm64", suffix: "" },
];

// Parse args to filter targets
const args = process.argv.slice(2);
const requestedTarget = args[0];

const targets = requestedTarget 
  ? ALL_TARGETS.filter(t => t.name === requestedTarget || t.target === requestedTarget)
  : ALL_TARGETS;

if (targets.length === 0) {
  console.error(`❌ No targets found matching "${requestedTarget}"`);
  process.exit(1);
}

console.log("🧹 Cleaning dist directory...");
// Only clean if building everything or if dist doesn't exist
if (!requestedTarget) {
  await $`rm -rf dist`;
  await $`mkdir -p dist`;
} else {
  await $`mkdir -p dist`;
}

console.log("🚀 Starting build...");

let failureCount = 0;

for (const { name, target, suffix } of targets) {
  const outfile = `dist/luccibot-${name}${suffix}`;
  console.log(`📦 Building for ${name} (${target})...`);
  
  try {
    // Compile index.tsx into a standalone executable
    await $`bun build --compile --minify --sourcemap --target ${target} ./index.tsx --outfile ${outfile}`;
    console.log(`✅ Created ${outfile}`);
  } catch (error) {
    console.error(`❌ Failed to build for ${name}. This is expected if you are cross-compiling native modules without the target platform's dependencies installed.`);
    failureCount++;
  }
}

if (failureCount > 0) {
  console.log(`⚠️  ${failureCount} build(s) failed. See above for details.`);
  // If user requested specific target and it failed, exit with error
  if (requestedTarget) process.exit(1);
} else {
  console.log("🎉 All builds complete!");
}
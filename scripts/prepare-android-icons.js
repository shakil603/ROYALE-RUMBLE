import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIconPath = path.resolve(__dirname, "../src/assets/images/royale_rumble_icon_1790517303961.jpg");
const resDir = path.resolve(__dirname, "../android/app/src/main/res");

const folders = [
  "mipmap-mdpi",
  "mipmap-hdpi",
  "mipmap-xhdpi",
  "mipmap-xxhdpi",
  "mipmap-xxxhdpi",
  "drawable",
];

if (!fs.existsSync(sourceIconPath)) {
  console.error("Source icon not found at:", sourceIconPath);
  process.exit(1);
}

const iconBuffer = fs.readFileSync(sourceIconPath);

folders.forEach((folder) => {
  const targetFolder = path.join(resDir, folder);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Write standard and round launcher icons
  fs.writeFileSync(path.join(targetFolder, "ic_launcher.png"), iconBuffer);
  fs.writeFileSync(path.join(targetFolder, "ic_launcher_round.png"), iconBuffer);
  console.log(`Copied Royale Rumble game icon to: ${folder}/ic_launcher.png & ic_launcher_round.png`);
});

console.log("All Android Launcher Icons configured successfully for Developer: Shakil!");

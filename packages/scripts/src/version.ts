import * as fs from "fs-extra";
import inquirer from "inquirer";
import { APP_BUILD_GRADLE_PATH, MAIN_PACKAGE_PATH } from "./paths";

/**
 * Set a consistent version number by incrementing the current
 * package.json version and also assigning to android version codes
 */
async function main() {
  const oldVersion = fs.readJSONSync(MAIN_PACKAGE_PATH).version;
  const newVersion = await promptNewVersion(oldVersion);
  updatePackageJson(newVersion);
  updateGradleBuild(newVersion);
}
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

function updateGradleBuild(newVersionName: string) {
  let gradleBuildFile = fs.readFileSync(APP_BUILD_GRADLE_PATH, {
    encoding: "utf-8",
  });
  const newVersionCode = _generateVersionCode(newVersionName);
  gradleBuildFile = gradleBuildFile.replace(/versionCode [0-9]+/g, `versionCode ${newVersionCode}`);
  gradleBuildFile = gradleBuildFile.replace(
    /versionName "[0-9]+\.[0-9]+\.[0-9]+"/g,
    `versionName "${newVersionName}"`
  );
  fs.writeFileSync(APP_BUILD_GRADLE_PATH, gradleBuildFile, { encoding: "utf-8" });
}

async function updatePackageJson(newVersion: string) {
  const packageJson = fs.readJSONSync(MAIN_PACKAGE_PATH);
  packageJson.version = newVersion;
  fs.writeJSONSync(MAIN_PACKAGE_PATH, packageJson, { spaces: 2 });
}

async function promptNewVersion(currentVersion: string) {
  const { version } = await inquirer.prompt([
    {
      message: `Specify a version number (current: ${currentVersion})`,
      name: "version",
      validate: (v) => {
        const nextCode = Number(_generateVersionCode(v));
        const currentCode = Number(_generateVersionCode(currentVersion));
        return nextCode > currentCode ? true : "Version number must be increased";
      },
    },
  ]);
  return version;
}

// 2.4.1 =>   2004001
// 2.40.1 =>  2040001
function _generateVersionCode(versionName: string) {
  const v = versionName.split(".");
  return `${Number(v[0]) * 1000000 + Number(v[1]) * 1000 + Number(v[2])}`;
}

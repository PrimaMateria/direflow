import chalk from "chalk";
import { ChildProcess, spawn } from "child_process";
import { resolve } from "path";
import { interupted, succeeded } from "./helpers/messages";

type TCommand = "start" | "test" | "build" | "build:lib";

const env = { ...process.env };
env.SKIP_PREFLIGHT_CHECK = "true";

export default function cli(args: Array<TCommand | string>) {
  const [command, ...restArgs] = args;

  switch (command as TCommand) {
    case "start":
      start();
      break;
    case "test":
      test(restArgs);
      break;
    case "build":
      build(restArgs);
      break;
    case "build:lib":
      buildLib(restArgs);
      break;
    default:
      console.log("No arguments provided.");
  }
}

function spawner(command: string, args: ReadonlyArray<string>, options?: any) {
  return spawn(command, args, options).on("exit", (code: number) => {
    if (code !== 0) {
      process.exit(code as number);
    }
  });
}

function start() {
  spawner("react-app-rewired", ["start"], {
    shell: true,
    stdio: "inherit",
    env
  });
}

function test(args: string[]) {
  spawner(
    "react-app-rewired",
    ["test", "--env=jest-environment-jsdom-fourteen", ...args],
    {
      shell: true,
      stdio: "inherit",
      env
    }
  );
}

function build(args: string[]) {
  spawner("react-app-rewired", ["build", ...args], {
    shell: true,
    stdio: "inherit",
    env
  });
}

function buildLib(args: string[]) {
  console.log("Building React component library...");
  let webpack: ChildProcess | undefined;

  if (args[0] === "--verbose") {
    webpack = spawner(
      "webpack",
      ["--config", resolve(__dirname, "../webpack.config.js")],
      {
        shell: true,
        stdio: "inherit",
        env
      }
    );
  } else {
    webpack = spawner("webpack", [
      "--config",
      resolve(__dirname, "../webpack.config.js")
    ]);
  }

  webpack.stdout?.on("data", data => {
    if (data.toString().includes("ERROR")) {
      console.log(chalk.red("An error occurred during the build!"));
      console.log(chalk.red(data.toString()));
    }
  });

  webpack.on("exit", (code: number) => {
    if (code !== 0) {
      console.log(interupted());
      return;
    }

    console.log(succeeded());
  });
}

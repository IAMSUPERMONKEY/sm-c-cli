import { CliError } from '@/shared/errors.js';
import type { CommandRunner } from './command-runner.js';

export const DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/';

const PACKAGE_NAME = 'sm-c-cli';
const SKILLS_SOURCE = 'IAMSUPERMONKEY/sm-c-cli';
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

export interface UpdateResult {
  previousVersion: string;
  latestVersion: string;
  cliUpdated: boolean;
  skillsUpdated: true;
}

function parseVersion(version: string): ParsedVersion {
  const match = SEMVER_PATTERN.exec(version);
  if (!match) {
    throw new CliError(30000, 'npm registry 返回了无效的版本号');
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  };
}

function comparePrerelease(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0 || right.length === 0) {
    return left.length === right.length ? 0 : left.length === 0 ? 1 : -1;
  }

  const identifierCount = Math.max(left.length, right.length);
  for (let index = 0; index < identifierCount; index += 1) {
    const leftIdentifier = left[index];
    const rightIdentifier = right[index];
    if (leftIdentifier === undefined || rightIdentifier === undefined) {
      return leftIdentifier === rightIdentifier ? 0 : leftIdentifier === undefined ? -1 : 1;
    }
    if (leftIdentifier === rightIdentifier) {
      continue;
    }

    const leftNumber = /^\d+$/.test(leftIdentifier) ? Number(leftIdentifier) : null;
    const rightNumber = /^\d+$/.test(rightIdentifier) ? Number(rightIdentifier) : null;
    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber > rightNumber ? 1 : -1;
    }
    if (leftNumber !== null || rightNumber !== null) {
      return leftNumber !== null ? -1 : 1;
    }
    return leftIdentifier > rightIdentifier ? 1 : -1;
  }

  return 0;
}

function isNewerVersion(candidate: string, current: string): boolean {
  const candidateVersion = parseVersion(candidate);
  const currentVersion = parseVersion(current);
  if (candidateVersion.major !== currentVersion.major) {
    return candidateVersion.major > currentVersion.major;
  }
  if (candidateVersion.minor !== currentVersion.minor) {
    return candidateVersion.minor > currentVersion.minor;
  }
  if (candidateVersion.patch !== currentVersion.patch) {
    return candidateVersion.patch > currentVersion.patch;
  }

  return comparePrerelease(candidateVersion.prerelease, currentVersion.prerelease) > 0;
}

export class UpdateService {
  constructor(
    private readonly runner: CommandRunner,
    private readonly currentVersion: string,
    private readonly registry: string = DEFAULT_NPM_REGISTRY,
    private readonly reportProgress: (message: string) => void = () => undefined,
  ) {}

  async update(): Promise<UpdateResult> {
    this.reportProgress('正在检查 sm-c-cli 版本...');
    const versionResult = await this.runner.run('npm', [
      'view',
      PACKAGE_NAME,
      'version',
      '--registry',
      this.registry,
    ]);
    const latestVersion = versionResult.stdout.trim();
    const shouldUpdateCli = isNewerVersion(latestVersion, this.currentVersion);
    this.reportProgress(`当前版本：${this.currentVersion}`);
    this.reportProgress(`最新版本：${latestVersion}`);
    this.reportProgress('');

    if (shouldUpdateCli) {
      this.reportProgress('发现新版本，正在更新 sm-c-cli...');
      await this.runner.run('npm', [
        'install',
        '--global',
        `${PACKAGE_NAME}@latest`,
        '--registry',
        this.registry,
      ]);
      this.reportProgress(`sm-c-cli 已更新至 ${latestVersion}`);
    } else {
      this.reportProgress('sm-c-cli 已是最新版本');
    }
    this.reportProgress('');

    this.reportProgress('正在更新 Skills...');
    await this.runner.run('npx', ['--yes', 'skills', 'add', SKILLS_SOURCE, '-y', '-g']);
    this.reportProgress('Skills 已更新');
    this.reportProgress('');
    this.reportProgress('更新完成');

    return {
      previousVersion: this.currentVersion,
      latestVersion,
      cliUpdated: shouldUpdateCli,
      skillsUpdated: true,
    };
  }
}

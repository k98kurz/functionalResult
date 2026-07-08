import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import {
  getSourcePath,
  getTargetPath,
  runExport,
  printHelp,
  cli,
} from '../src/bin/functionalResult-skill-export.js';

vi.mock('fs');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Skill Export', () => {
  describe('getTargetPath', () => {
    it('[S01] returns correct path for each known platform', () => {
      expect(getTargetPath('claude')).toBe(
        '.claude/skills/functional-result/SKILL.md'
      );
      expect(getTargetPath('codex')).toBe(
        '.agent/skills/functional-result/SKILL.md'
      );
      expect(getTargetPath('cursor')).toBe(
        '.cursor/skills/functional-result/SKILL.md'
      );
      expect(getTargetPath('opencode')).toBe(
        '.opencode/skills/functional-result/SKILL.md'
      );
    });

    it('[S02] returns default path for unknown platform', () => {
      expect(getTargetPath('unknown')).toBe(
        '.agent/skills/functional-result/SKILL.md'
      );
    });
  });

  describe('getSourcePath', () => {
    it('[S03] returns absolute path ending with SKILL.md', () => {
      const sourcePath = getSourcePath();
      expect(sourcePath).toMatch(/SKILL\.md$/);
    });
  });

  describe('printHelp', () => {
    it('[S04] prints usage information', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      printHelp();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    });
  });

  describe('cli', () => {
    it('[S05] prints help and exits 0 with --help flag', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      cli(['--help']);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('[S06] exports SKILL.md to correct platform path', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      cli(['opencode']);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('.opencode/skills/functional-result/SKILL.md')
      );
      expect(exitSpy).not.toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    it('[S07] logs error and exits 1 on filesystem failure', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      vi.mocked(fs.mkdirSync).mockImplementationOnce(() => {
        throw new Error('permission denied');
      });
      cli(['opencode']);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('permission denied')
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});

import { spawn } from 'node:child_process';

// Trigger pre-registered Windows Scheduled Tasks instead of spawning pwsh
// directly. Tasks run as the user account (S4U logon) so they inherit the
// full Claude Code profile, plugin registry, OAuth tokens, vault MCP, voice
// profiles, etc. — none of which a LocalSystem-spawned process can reach.
//
// Tasks are registered by setup.ps1 and state/register-mc-manual.ps1.
const TASK_BY_MODE = {
  manual:  'MorningCompass-Manual',
  refresh: 'MorningCompass-Refresh',
};

export function spawnRunner(mode, opts = {}) {
  const taskName = TASK_BY_MODE[mode];
  if (!taskName) {
    console.error('SPAWN_RUNNER_UNMAPPED', { mode, supported: Object.keys(TASK_BY_MODE) });
    return null;
  }
  const args = ['/Run', '/TN', taskName];
  const cmd = { executable: 'schtasks.exe', args, mode, taskName };

  if (opts.dryBuildOnly) return cmd;

  const child = spawn(cmd.executable, cmd.args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.on('error', (err) => {
    console.error('SPAWN_RUNNER_ERROR', { taskName, mode, error: err.message });
  });
  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error('SPAWN_RUNNER_EXIT', { taskName, mode, code, signal });
    }
  });
  child.unref();
  return { ...cmd, pid: child.pid };
}

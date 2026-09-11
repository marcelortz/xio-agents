# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
shopt -s expand_aliases
# Check for rg availability
if ! (unalias rg 2>/dev/null; command -v rg) >/dev/null 2>&1; then
  function rg {
  local _cc_bin="${CLAUDE_CODE_EXECPATH:-}"
  [[ -x $_cc_bin ]] || _cc_bin=/c/Users/omsor/.local/bin/claude.exe
  if [[ ! -x $_cc_bin ]]; then command rg ${1+"$@"}; return; fi
  if [[ -n ${ZSH_VERSION:-} ]]; then
    ARGV0=rg "$_cc_bin" ${1+"$@"}
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    ARGV0=rg "$_cc_bin" ${1+"$@"}
  else
    (exec -a rg "$_cc_bin" ${1+"$@"})
  fi
}
fi
# Shadow pkill to refuse patterns matching the CLI process
unalias pkill 2>/dev/null || true
function pkill {
  if [ -n "${CLAUDE_PID:-}" ] && [ -r "/proc/${CLAUDE_PID}/comm" ]; then
    local _cc_skip="" _cc_a
    local -a _cc_probe=()
    for _cc_a in ${1+"$@"}; do
      if [ -n "$_cc_skip" ]; then _cc_skip=""; continue; fi
      case "$_cc_a" in
        --signal) _cc_skip=1 ;;
        --signal=*|-e|--echo) ;;
        -[0-9]*) ;;
        -[PUGOF]?*) _cc_probe+=("$_cc_a") ;;
        -[ABCDEFGHIJKLMNOPQRSTUVWXYZ][ABCDEFGHIJKLMNOPQRSTUVWXYZ0-9]*) ;;
        *) _cc_probe+=("$_cc_a") ;;
      esac
    done
    if command pgrep ${_cc_probe[@]+"${_cc_probe[@]}"} 2>/dev/null | command grep -qx "${CLAUDE_PID}"; then
      printf 'pkill: refusing to run — this pattern matches the Claude CLI process (PID %s). Narrow the pattern, or target your own children with `pkill -P $$ ...`.\n' "${CLAUDE_PID}" >&2
      return 1
    fi
  fi
  command pkill ${1+"$@"}
}
export PATH='/c/Users/omsor/bin:/mingw64/bin:/usr/local/bin:/usr/bin:/bin:/mingw64/bin:/usr/bin:/c/Users/omsor/bin:/c/Windows/system32:/c/Windows:/c/Windows/System32/Wbem:/c/Windows/System32/WindowsPowerShell/v1.0:/c/Windows/System32/OpenSSH:/c/Program Files (x86)/NVIDIA Corporation/PhysX/Common:/c/Program Files/dotnet:/c/WINDOWS/system32:/c/WINDOWS:/c/WINDOWS/System32/Wbem:/c/WINDOWS/System32/WindowsPowerShell/v1.0:/c/WINDOWS/System32/OpenSSH:/c/Program Files/Common Files/Autodesk Shared:/c/Program Files/Microsoft SQL Server/150/Tools/Binn:/c/Program Files/nodejs:/cmd:/c/Users/omsor/AppData/Local/Microsoft/WindowsApps:/c/Users/omsor/AppData/Roaming/Programs/Zero Install:/c/Users/omsor/AppData/Local/Microsoft/WindowsApps:/c/Users/omsor/AppData/Local/Programs/Microsoft VS Code/bin:/c/Users/omsor/AppData/Local/PowerToys/DSCModules:/c/Users/omsor/AppData/Local/Programs/Obsidian:/c/Users/omsor/AppData/Roaming/npm:/c/Program Files/nodejs:/mingw64/bin:/usr/bin/vendor_perl:/usr/bin/core_perl:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_011v5h6QUzBZvas64y44XLhy/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_014WxCYbLf7f3uw2isHFR9US/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_017zncz89kmhdPgdpZQZm5Dj/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_01BYoFffWxgV8R5TZ6fEVCih/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_01Eeb9y5m4iFuY3yRtytYfdc/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_01FTLa86dhbVJ3HB1LdHdhN7/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_01KmRfL8EXGF3PeqMRzef1TR/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/72fa0b00-5788-4a58-88d8-5a593a06f3ec/rpm/plugin_01VyNDLNYUZHHyKf7A691D7V/bin:/c/Users/omsor/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/72fa0b00-5788-4a58-88d8-5a593a06f3ec/33a9f2be-dbab-4ec2-a16c-e6b7a8e86c9f/bin'

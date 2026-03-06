import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { dockerApi } from '../api';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

interface TerminalProps {
  containerId: string;
  containerName: string;
  onClose: () => void;
}

const Terminal = ({ containerId, containerName, onClose }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', monospace",
      theme: {
        background: '#1E1E1E',
        foreground: '#CCCCCC',
        cursor: '#FFFFFF',
        selectionBackground: '#0078D740'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    setTimeout(() => {
      fitAddon.fit();
    }, 10);

    const initTerminal = async () => {
      try {
        await dockerApi.startTerminal(containerId, (event) => {
          term.write(event.data);
        });
        
        setConnected(true);

        term.onData((data) => {
          dockerApi.writeTerminal(containerId, data).catch(console.error);
        });

        term.onResize(({ cols, rows }) => {
          dockerApi.resizeTerminal(containerId, cols, rows).catch(console.error);
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to terminal');
      }
    };

    initTerminal();

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      dockerApi.closeTerminal(containerId).catch(console.error);
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [containerId]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span className="terminal-title">{containerName} — Terminal</span>
        <button className="terminal-close-btn" onClick={onClose}>×</button>
      </div>
      {error && <div className="terminal-error">{error}</div>}
      {!connected && !error && <div className="terminal-connecting">Connecting...</div>}
      <div className="terminal-content" ref={terminalRef} />
    </div>
  );
};

export default Terminal;
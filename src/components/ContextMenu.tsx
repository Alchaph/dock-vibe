import { useEffect, useRef } from 'react';
import type { ContainerInfo } from '../types';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  container: ContainerInfo;
  onAction: (action: string, id: string) => void;
  onViewDetails: (id: string) => void;
  onViewLogs: (id: string) => void;
  onClose: () => void;
  actionLoading?: Record<string, string>;
}

const ContextMenu = ({ x, y, container, onAction, onViewDetails, onViewLogs, onClose, actionLoading = {} }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoading = !!actionLoading[container.id];
  const state = container.state.toLowerCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      menuRef.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > viewportHeight) {
      menuRef.current.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
    >
      <div className="context-menu-header">
        <span className="context-menu-name">{container.name || container.id.substring(0, 12)}</span>
        <span className={`context-menu-state context-menu-state-${state}`}>{container.state}</span>
      </div>
      <div className="context-menu-divider" />

      <button
        className="context-menu-item"
        onClick={() => { onViewDetails(container.id); onClose(); }}
      >
        <span className="context-menu-icon">&#9776;</span>
        Details
      </button>

      {state === 'running' && (
        <button
          className="context-menu-item"
          onClick={() => { onViewLogs(container.id); onClose(); }}
        >
          <span className="context-menu-icon">&#9998;</span>
          View Logs
        </button>
      )}

      <div className="context-menu-divider" />

      {state === 'running' && (
        <>
          <button
            className="context-menu-item context-menu-item-warning"
            onClick={() => { onAction('stop', container.id); onClose(); }}
            disabled={isLoading}
          >
            <span className="context-menu-icon">&#9632;</span>
            {actionLoading[container.id] === 'stop' ? 'Stopping...' : 'Stop'}
          </button>
          <button
            className="context-menu-item"
            onClick={() => { onAction('restart', container.id); onClose(); }}
            disabled={isLoading}
          >
            <span className="context-menu-icon">&#8635;</span>
            Restart
          </button>
          <button
            className="context-menu-item"
            onClick={() => { onAction('pause', container.id); onClose(); }}
            disabled={isLoading}
          >
            <span className="context-menu-icon">&#9208;</span>
            {actionLoading[container.id] === 'pause' ? 'Pausing...' : 'Pause'}
          </button>
        </>
      )}

      {state === 'exited' && (
        <>
          <button
            className="context-menu-item context-menu-item-success"
            onClick={() => { onAction('start', container.id); onClose(); }}
            disabled={isLoading}
          >
            <span className="context-menu-icon">&#9654;</span>
            {actionLoading[container.id] === 'start' ? 'Starting...' : 'Start'}
          </button>
        </>
      )}

      {state === 'paused' && (
        <button
          className="context-menu-item"
          onClick={() => { onAction('unpause', container.id); onClose(); }}
          disabled={isLoading}
        >
          <span className="context-menu-icon">&#9654;</span>
          {actionLoading[container.id] === 'unpause' ? 'Unpausing...' : 'Unpause'}
        </button>
      )}

      {state !== 'running' && (
        <>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item context-menu-item-danger"
            onClick={() => { onAction('remove', container.id); onClose(); }}
            disabled={isLoading}
          >
            <span className="context-menu-icon">&#10005;</span>
            {actionLoading[container.id] === 'remove' ? 'Removing...' : 'Remove'}
          </button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;

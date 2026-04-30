// Cloud sync placeholder - add @supabase/supabase-js to enable
// Environment variables required in .env.local:
// NEXT_PUBLIC_SUPABASE_URL=your-project-url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

export interface SyncState {
  directories: { id: string; name: string; collapsed: boolean }[];
  tasks: {
    id: string;
    directoryId: string;
    name: string;
    columns: { id: string; name: string; type: string; options?: unknown; width?: number }[];
    rows: { id: string; indent: number; cells: Record<string, unknown>; collapsed: boolean; tags?: string[] }[];
  }[];
  activeTaskId: string | null;
  sidebarOpen: boolean;
  viewMode: string;
  locale: string;
}

class CloudSync {
  private isConnected = false;

  connect(_userId: string, onSync: (state: SyncState) => void) {
    console.warn('Cloud sync not configured - set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Placeholder - would connect to Supabase real-time here
  }

  disconnect() {
    this.isConnected = false;
  }

  sendSync(_state: SyncState) {
    // Placeholder - would send to Supabase here
  }

  isEnabled() {
    return false;
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const cloudSync = new CloudSync();
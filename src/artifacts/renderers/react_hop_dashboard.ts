/**
 * React Hop Dashboard Renderer
 * Interactive status board for phase/hop tracking with CTS compliance
 */

import { ArtifactRenderer } from '../types.js';

export interface HopData {
  id: string;
  name: string;
  status: 'planned' | 'in_progress' | 'completed';
  description: string;
  estimatedLOC: number;
  actualLOC?: number;
  ctsCompliant: boolean;
  phase: string;
  dependencies: string[];
  tests?: {
    total: number;
    passing: number;
    coverage: number;
  };
}

export interface PhaseData {
  name: string;
  hops: HopData[];
}

export interface HopDashboardData {
  currentPhase: string;
  phases: PhaseData[];
  stats: {
    totalLOC: number;
    plannedLOC: number;
    ctsComplianceRate: number;
    completionRate: number;
  };
}

export class ReactHopDashboardRenderer implements ArtifactRenderer {
  readonly type = 'hop_dashboard';

  async render(data: unknown): Promise<string> {
    const dashboardData = data as HopDashboardData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hop Dashboard - CTS Compliance Tracker</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
    }

    .hop-dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: #252526;
      border-radius: 8px;
      border: 1px solid #007acc;
      margin-bottom: 20px;
    }

    .dashboard-header h1 {
      margin: 0;
      color: #007acc;
      font-size: 24px;
    }

    .filter-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .filter-controls label {
      font-size: 14px;
      color: #858585;
    }

    .filter-controls select {
      background: #1e1e1e;
      color: #d4d4d4;
      border: 1px solid #007acc;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }

    .stats-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #252526;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #007acc;
    }

    .stat-label {
      font-size: 12px;
      color: #858585;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #d4d4d4;
    }

    .stat-card.compliance .stat-value {
      color: #16825d;
    }

    .stat-card.completion .stat-value {
      color: #007acc;
    }

    .hop-list {
      display: grid;
      gap: 15px;
    }

    .hop-card {
      background: #252526;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid #858585;
    }

    .hop-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .hop-card.planned {
      border-left-color: #ffa500;
    }

    .hop-card.in_progress {
      border-left-color: #007acc;
    }

    .hop-card.completed {
      border-left-color: #16825d;
    }

    .hop-card.violation {
      border-left-color: #f48771;
      background: #2d2020;
    }

    .hop-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .hop-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .hop-status-icon {
      font-size: 20px;
    }

    .hop-title h3 {
      margin: 0;
      font-size: 18px;
      color: #d4d4d4;
    }

    .hop-meta {
      text-align: right;
    }

    .hop-loc {
      font-size: 14px;
      font-weight: bold;
    }

    .hop-loc.compliant {
      color: #16825d;
    }

    .hop-loc.violation {
      color: #f48771;
    }

    .hop-description {
      color: #858585;
      font-size: 14px;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .hop-details {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #858585;
    }

    .hop-detail-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .phase-label {
      display: inline-block;
      background: #007acc;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #858585;
    }

    .empty-state h3 {
      margin-bottom: 10px;
      color: #d4d4d4;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState } = React;

    const HopDashboard = ({ data }) => {
      const [statusFilter, setStatusFilter] = useState('all');

      // Flatten all hops from all phases
      const allHops = data.phases.flatMap(phase => 
        phase.hops.map(hop => ({ ...hop, phase: phase.name }))
      );

      // Filter hops by status
      const filteredHops = statusFilter === 'all' 
        ? allHops 
        : allHops.filter(hop => hop.status === statusFilter);

      const handleHopClick = (hop) => {
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'artifact_interaction',
            action: 'hop_details',
            payload: { hopId: hop.id, name: hop.name }
          }, '*');
        }
        console.log('[Hop Dashboard] Hop clicked:', hop.id);
      };

      const getStatusIcon = (status) => {
        switch (status) {
          case 'completed': return '✅';
          case 'in_progress': return '🔄';
          case 'planned': return '⏳';
          default: return '❓';
        }
      };

      return (
        <div className="hop-dashboard">
          <div className="dashboard-header">
            <h1>📊 Hop Dashboard - {data.currentPhase}</h1>
            <div className="filter-controls">
              <label htmlFor="status-filter">Filter by Status:</label>
              <select 
                id="status-filter"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All ({allHops.length})</option>
                <option value="completed">Completed ({allHops.filter(h => h.status === 'completed').length})</option>
                <option value="in_progress">In Progress ({allHops.filter(h => h.status === 'in_progress').length})</option>
                <option value="planned">Planned ({allHops.filter(h => h.status === 'planned').length})</option>
              </select>
            </div>
          </div>

          <div className="stats-panel">
            <div className="stat-card">
              <div className="stat-label">Total LOC</div>
              <div className="stat-value">{data.stats.totalLOC.toLocaleString()}</div>
              <div className="stat-label">of {data.stats.plannedLOC.toLocaleString()} planned</div>
            </div>
            <div className="stat-card compliance">
              <div className="stat-label">CTS Compliance</div>
              <div className="stat-value">{data.stats.ctsComplianceRate}%</div>
              <div className="stat-label">{allHops.filter(h => h.ctsCompliant).length}/{allHops.length} hops</div>
            </div>
            <div className="stat-card completion">
              <div className="stat-label">Completion Rate</div>
              <div className="stat-value">{data.stats.completionRate}%</div>
              <div className="stat-label">{allHops.filter(h => h.status === 'completed').length}/{allHops.length} completed</div>
            </div>
          </div>

          <div className="hop-list">
            {filteredHops.length === 0 ? (
              <div className="empty-state">
                <h3>No hops match the current filter</h3>
                <p>Try selecting a different status filter</p>
              </div>
            ) : (
              filteredHops.map(hop => (
                <div 
                  key={hop.id} 
                  className={\`hop-card \${hop.status} \${hop.ctsCompliant ? '' : 'violation'}\`}
                  onClick={() => handleHopClick(hop)}
                >
                  <div className="hop-header">
                    <div className="hop-title">
                      <span className="hop-status-icon">{getStatusIcon(hop.status)}</span>
                      <h3>{hop.id}: {hop.name}</h3>
                    </div>
                    <div className="hop-meta">
                      <div className={\`hop-loc \${hop.ctsCompliant ? 'compliant' : 'violation'}\`}>
                        {hop.actualLOC || 0}/{hop.estimatedLOC} LOC
                        {hop.ctsCompliant ? ' ✅' : ' ❌'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="hop-description">
                    {hop.description}
                  </div>

                  <div className="hop-details">
                    <span className="phase-label">{hop.phase}</span>
                    <div className="hop-detail-item">
                      <span>📦 Dependencies:</span> {hop.dependencies.length}
                    </div>
                    {hop.tests && (
                      <div className="hop-detail-item">
                        <span>🧪 Tests:</span> {hop.tests.passing}/{hop.tests.total} ({hop.tests.coverage}%)
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    };

    // Data passed from server
    const dashboardData = ${JSON.stringify(dashboardData)};

    // Render React component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(HopDashboard, { data: dashboardData }));

    // Send ready message
    console.log('[Hop Dashboard] React renderer loaded');
    console.log('[Hop Dashboard] Data:', dashboardData);
    
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'artifact_ready', artifactType: 'hop_dashboard' }, '*');
    }
  </script>
</body>
</html>
    `.trim();
  }
}

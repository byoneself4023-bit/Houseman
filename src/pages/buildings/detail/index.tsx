import React from 'react';
import { BuildingDetailPageInner } from './BuildingDetailPage';

class BuildingDetailErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div style={{ padding: 24 }}>
          <div
            style={{
              padding: 20,
              background: '#FEF2F2',
              border: '2px solid #FECACA',
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#DC2626',
                marginBottom: 8,
              }}
            >
              페이지 렌더링 오류
            </div>
            <pre
              style={{
                fontSize: 12,
                color: '#991B1B',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#DC2626',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

export const BuildingDetailPage: React.FC<Record<string, any>> = (props) => (
  <BuildingDetailErrorBoundary>
    <BuildingDetailPageInner {...(props as any)} />
  </BuildingDetailErrorBoundary>
);

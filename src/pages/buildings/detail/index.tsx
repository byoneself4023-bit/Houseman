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
        <div className="p-6">
          <div className="p-5 bg-hm-danger-bg border-2 border-red-300 rounded-xl">
            <div className="text-base font-extrabold text-hm-danger mb-2">
              페이지 렌더링 오류
            </div>
            <pre className="text-xs text-red-800 whitespace-pre-wrap break-all">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-3 px-4 py-2 rounded-lg border-none bg-hm-danger text-white font-bold cursor-pointer hover:brightness-90 transition-all"
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

import { Component } from 'react';
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('App error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:24,fontFamily:'monospace',color:'#c62828',background:'#fef2f2',minHeight:'100vh'}}>
          <h2>Something went wrong</h2>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{String(this.state.error && this.state.error.stack || this.state.error)}</pre>
          <p style={{color:'#333',fontFamily:'sans-serif'}}>Open the browser console (F12) for more details, or share this message.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

"use client";
// Catches render errors in the house view and shows the load-error message (haunted-house-ui R17.5).
import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

import { Component } from "react";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import Button from "../Button/Button";
import "./ErrorBoundary.css";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage>
          <p>Ocurrió un error al cargar esta página.</p>
          <Button onClick={this.handleReload} className="error-boundary-reload">
            Recargar
          </Button>
        </ErrorMessage>
      );
    }
    return this.props.children;
  }
}

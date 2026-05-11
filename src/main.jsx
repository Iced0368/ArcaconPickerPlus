import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// 리액트 에러 방지용 removeChild
const origRemove = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
  if (child.parentNode !== this) {
    // 리액트가 지우려고 하는데 이미 부모가 아니거나 사라진 경우 무시
    return child;
  }
  return origRemove.apply(this, arguments);
};

ReactDOM.createRoot(
  (() => {
    const app = document.createElement("div");
    document.body.append(app);
    return app;
  })(),
).render(<App />);

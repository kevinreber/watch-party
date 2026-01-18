/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

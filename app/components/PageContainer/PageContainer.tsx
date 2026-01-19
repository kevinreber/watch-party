import Container from "@mui/material/Container";

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer = ({ children }: PageContainerProps) => (
  <Container
    maxWidth="lg"
    style={{ display: "flex", flexDirection: "column", padding: "1rem" }}
  >
    {children}
  </Container>
);

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer = ({ children }: PageContainerProps) => (
  <div className="container mx-auto px-4 flex flex-col max-w-7xl">
    {children}
  </div>
);

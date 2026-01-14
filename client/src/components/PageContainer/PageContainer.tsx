import React from 'react';

const PageContainer = ({ children }: { children: JSX.Element }) => (
  <div className="container mx-auto px-4 py-6 flex flex-col max-w-7xl">
    {children}
  </div>
);

export default PageContainer;

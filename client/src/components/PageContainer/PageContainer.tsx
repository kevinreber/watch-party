import React from 'react';
import Container from '@mui/material/Container';

const PageContainer = ({ children }: { children: JSX.Element }) => (
	<Container maxWidth="lg" style={{ display: 'flex', flexDirection: 'column' }}>
		{children}
	</Container>
);

export default PageContainer;

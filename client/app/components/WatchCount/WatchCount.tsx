import React from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';

const WatchCount = ({ usersCount }: { usersCount: number }) => {
  return (
    <>
      {usersCount}
      <VisibilityIcon />
    </>
  );
};

export default WatchCount;

import React from 'react';
import { Button } from '@material-ui/core';

// Components
import WatchList from '../WatchList/WatchList';
import ChatList from '../ChatList/ChatList';
import WatchCount from '../WatchCount/WatchCount';

import './SideList.css';

interface SideListTypes {
  videos: any;
  removeVideoFromList: any;
  socket: any;
  usersCount: number;
}

const SideList = ({
  videos,
  removeVideoFromList,

  socket,
  usersCount,
}: SideListTypes): JSX.Element => {
  const [activeList, setActiveList] = React.useState('videos');

  const toggleActiveList = (active: string) => {
    setActiveList(active);
  };

  return (
    <>
      <div className="Side-List-Header">
        <Button onClick={() => toggleActiveList('videos')}>Videos</Button>
        <Button onClick={() => toggleActiveList('chats')}>Chat</Button>
      </div>
      {activeList === 'videos' ? (
        <WatchList videos={videos} removeVideo={removeVideoFromList} />
      ) : (
        <ChatList socket={socket} />
      )}
      <WatchCount usersCount={usersCount} />
    </>
  );
};

export default SideList;

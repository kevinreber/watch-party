import React from 'react';
import { Button } from '@material-ui/core';
import { UserContext } from '@context';
import { useHandleMessages } from '@hooks';

import { WatchList, ChatList, WatchCount } from '@components';

import './SideList.css';

interface SideListTypes {
  videos: any;
  removeVideoFromList: any;
  socket: any;
  usersCount: number;
}

const SideList = ({ videos, removeVideoFromList, socket, usersCount }: SideListTypes): JSX.Element => {
  // @ts-ignore
  const { user } = React.useContext(UserContext);

  const [activeList, setActiveList] = React.useState('videos');
  const { messages, sendMessage } = useHandleMessages(socket, user);

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
        <ChatList socket={socket} messages={messages} sendMessage={sendMessage} />
      )}
      <WatchCount usersCount={usersCount} />
    </>
  );
};

export default SideList;

export const SOCKET_CLIENT = {
  EVENTS: {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
  },
  EMITTER: {
    VIDEO_LIST_EVENT: "video_list_event",
    SEND_MESSAGE: "send_message",
    RECEIVE_MESSAGE: "MSG:receive-message",
    JOIN_ROOM: "ROOM:user-join-room",
  },
  LISTENER: {
    JOIN_ROOM: "ROOM:user-join-room",
    RECEIVE_MESSAGE: "MSG:receive-message",
    UPDATE_VIDEO_LIST: "update_video_list",
    USER_UPDATED: "user_updated",
    UPDATE_USER_COUNT: "update_user_count",
  },
};

export const SOCKET_CLIENT_EVENTS = {
  connect: "connect",
};

export const SOCKET_CLIENT_EMITTER = {
  videoListEvent: "video_list_event",
  sendMessage: "send_message",
  receiveMessage: "MSG:receive-message",
  JOIN_ROOM: "ROOM:user-join-room",
};

export const SOCKET_CLIENT_LISTENER = {
  receiveMessage: "MSG:receive-message",
  updateVideoList: "update_video_list",
  userUpdated: "user_updated",
  userUpdateCount: "update_user_count",
};

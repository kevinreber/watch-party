export const SOCKET_SERVER = {
  EVENTS: {
    CONNECTION: "connection",
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

import { Avatar, IconButton } from "@material-ui/core";
import {
  AttachFile,
  DoubleArrow,
  InsertEmoticon,
  Mic,
  MoreVert,
  SearchOutlined,
} from "@material-ui/icons";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Chat.css";
import db from "../../firebase";
import firebase from "firebase";
import { AuthContext } from "../../context/auth-context";
import { storage } from "../../firebase";

function Chat() {
  const [input, setInput] = useState("");
  const [seed, setSeed] = useState("");
  const { roomId } = useParams();
  const [roomName, setRoomName] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);

  const [messages, setMessages] = useState([]);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (roomId) {
      // pull the name from db based on room id
      db.collection("rooms")
        .doc(roomId)
        .onSnapshot((snapshot) => setRoomName(snapshot.data().name));

      // pull the messages from db to specific roomId
      db.collection("rooms")
        .doc(roomId)
        .collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) =>
          setMessages(snapshot.docs.map((doc) => doc.data()))
        );
    }
  }, [roomId]);

  useEffect(() => {
    if (file) {
      const storageRef = storage.ref(file.name);

      storageRef.put(file).on(
        "state_changed",
        (snap) => {
          let progress = snap.bytesTransferred / snap.totalBytes / 100;
          setProgress(progress);
        },
        (error) => {
          alert(error.message);
        },
        async () => {
          const url = await storageRef.getDownloadURL();
          const name = authContext.user.displayName;
          const timestamp = firebase.firestore.FieldValue.serverTimestamp();
          db.collection("rooms")
            .doc(roomId)
            .collection("messages")
            .add({ name, timestamp, url });
        }
      );
    }
  }, [file, authContext.user, roomId]);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 5000));
  }, []);

  const sendMessage = (event) => {
    event.preventDefault();

    // add message to db
    db.collection("rooms").doc(roomId).collection("messages").add({
      name: authContext.user.displayName,
      message: input,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    setInput("");
  };

  const types = ["image/jpeg", "image/png"];

  const imageUploadHandler = (event) => {
    const selected = event.target.files[0];

    if (selected && types.includes(selected.type)) {
      setFile(selected);
    } else {
      setFile(null);
      alert("please select file of type jpeg/png");
    }
  };

  return (
    <div className="chat">
      <div className="chat__header">
        <Avatar src={`https://avatars.dicebear.com/api/human/${seed}.svg`} />
        <div className="chat__headerInfo">
          <h3>{roomName}</h3>
          <p>
            last seen{" "}
            {new Date(
              messages[messages.length - 1]?.timestamp?.toDate()
            ).toUTCString()}
          </p>
        </div>
        <div className="chat__headerRight">
          <IconButton>
            <SearchOutlined />
          </IconButton>

          <IconButton>
            <MoreVert />
          </IconButton>
        </div>
      </div>

      <div className="chat__body">
        <p className={`chat_message ${true && "chat__receiver"}`}>
          <span className="chat__username">Sanket Dhabarde</span>
          hey guys
          <span className="chat__timestamp">6:23</span>
        </p>
        {messages.map((message) =>
          !message.url ? (
            <p
              className={`chat_message ${
                message.name === authContext.user.displayName &&
                "chat__receiver"
              }`}
            >
              <span className="chat__username">{message.name}</span>
              {message.message}
              <span className="chat__timestamp">
                {new Date(message.timestamp?.toDate()).toUTCString()}
              </span>
            </p>
          ) : (
            <div
              className={`chat_Img ${
                message.name === authContext.user.displayName &&
                "chat__receiverImg"
              }`}
            >
              <span className="chat__usernameImg">{message.name}</span>
              <img className="chat__image" src={message.url}></img>
              <p className="chat__timestampImg">
                {new Date(message.timestamp?.toDate()).toUTCString()}
              </p>
            </div>
          )
        )}
      </div>

      <div className="chat__footer">
        <IconButton>
          <InsertEmoticon />
        </IconButton>
        <label>
          <input type="file" onChange={imageUploadHandler} />
          <span>
            <AttachFile />
          </span>
        </label>
        <form>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="write a message"
          />
          <IconButton type="submit" onClick={sendMessage}>
            <DoubleArrow />
          </IconButton>
        </form>
      </div>
    </div>
  );
}

export default Chat;

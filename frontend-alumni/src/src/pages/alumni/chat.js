import { useState, useRef, useEffect } from "react";
import "./chat.css";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Trash2,
  Reply,
  Edit,
  Download,
  Eye,
  File,
} from "lucide-react";

export default function ChatStatic() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "friend", type: "text", content: "Hey Yara!", reply_to: null, is_edited: false },
    { id: 2, sender: "me", type: "text", content: "Hey! Check this out 👇", reply_to: null, is_edited: false },
    { id: 3, sender: "me", type: "image", content: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500", reply_to: null, is_edited: false },
  ]);

  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    return () => {
      if (filePreview?.isObjectURL) URL.revokeObjectURL(filePreview.url);
      messages.forEach((m) => {
        if (m._local && m.content) {
          try {
            URL.revokeObjectURL(m.content);
          } catch {}
        }
      });
    };
  }, []);

  const findMessageById = (id) => messages.find((m) => m.id === id);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (filePreview?.isObjectURL) URL.revokeObjectURL(filePreview.url);
    const type = f.type;
    const url = URL.createObjectURL(f);
    const isImage = type.startsWith("image/");
    const isVideo = type.startsWith("video/");
    setFile(f);
    setFilePreview({
      type: isImage ? "image" : isVideo ? "video" : "file",
      url,
      name: f.name,
      size: f.size,
      isObjectURL: true,
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const openOverlay = (msg) => {
    if (msg.type === "image" || msg.type === "video") setOverlay(msg);
  };

  const closeOverlay = (e) => {
    e.stopPropagation();
    setOverlay(null);
  };

  const replyMessage = (msg) => {
    setReplyTo(msg);
    setEditId(null);
    setInput("");
  };

  const editMessage = (msg) => {
    if (msg.sender !== "me" || msg.type !== "text") return;
    setEditId(msg.id);
    setInput(msg.content);
    setReplyTo(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFilePreview(null);
  };

  const deleteMessage = (msg) => {
    if (msg.sender !== "me") return;
    if (!window.confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    if (replyTo?.id === msg.id) setReplyTo(null);
    if (editId === msg.id) {
      setEditId(null);
      setInput("");
    }
  };

  const sendMessage = () => {
    if (!input.trim() && !file) return;

    if (editId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editId ? { ...m, content: input, is_edited: true } : m
        )
      );
      setEditId(null);
      setInput("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFilePreview(null);
      return;
    }

    let newMsg;
    if (file && filePreview) {
      newMsg = {
        id: Date.now(),
        sender: "me",
        type: filePreview.type,
        content: filePreview.url,
        filename: filePreview.name,
        reply_to: replyTo ? replyTo.id : null,
        is_edited: false,
        _local: true,
      };
    } else {
      newMsg = {
        id: Date.now(),
        sender: "me",
        type: "text",
        content: input,
        reply_to: replyTo ? replyTo.id : null,
        is_edited: false,
      };
    }

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFilePreview(null);
    setReplyTo(null);
  };

  const renderRepliedSnippet = (msg) => {
    if (!msg.reply_to) return null;
    const replied = findMessageById(msg.reply_to);
    if (!replied) return null;
    const text = replied.type === "text" ? replied.content : replied.type.toUpperCase();
    return (
      <div className="reply-line">
        <Reply size={12} />{" "}
        <span className="reply-text">
          {String(text).slice(0, 40)}
          {String(text).length > 40 ? "..." : ""}
        </span>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <h2>Chat</h2>

      <div className="messages-box">
        {messages.length === 0 && <div className="empty">No messages yet</div>}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === "me" ? "sent" : "received"}`}
          >
            {renderRepliedSnippet(msg)}

            {msg.type === "text" && (
              <p className="msg-text">
                {msg.content}
                {msg.is_edited && <span className="edited"> (edited)</span>}
              </p>
            )}

            {msg.type === "image" && (
              <img
                src={msg.content}
                alt="sent"
                className="chat-media"
                onClick={() => openOverlay(msg)}
              />
            )}

            {msg.type === "video" && (
              <video className="chat-media" onClick={() => openOverlay(msg)} controls>
                <source src={msg.content} type="video/mp4" />
              </video>
            )}

            {msg.type === "file" && (
              <a href={msg.content} target="_blank" rel="noreferrer" className="file-link">
                <File size={14} /> {msg.filename || "File"}
              </a>
            )}

            <div className="actions">
              <button className="icon-btn reply" onClick={() => replyMessage(msg)}>
                <Reply size={14} />
              </button>
              {msg.sender === "me" && (
                <>
                  {msg.type === "text" && (
                    <button className="icon-btn edit" onClick={() => editMessage(msg)}>
                      <Edit size={14} />
                    </button>
                  )}
                  <button className="icon-btn delete" onClick={() => deleteMessage(msg)}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {replyTo && (
        <div className="reply-preview">
          <Reply size={14} />
          <span>
            {replyTo.type === "text"
              ? replyTo.content.slice(0, 60)
              : replyTo.type.toUpperCase()}
          </span>
          <button onClick={() => setReplyTo(null)} className="icon-btn close">
            <X size={16} />
          </button>
        </div>
      )}

      {filePreview && (
        <div className="file-preview">
          <div className="file-preview-left">
            {filePreview.type === "image" && (
              <img src={filePreview.url} alt="preview" className="preview-thumb" />
            )}
            {filePreview.type === "video" && (
              <video className="preview-thumb" controls>
                <source src={filePreview.url} />
              </video>
            )}
            {filePreview.type === "file" && <File size={30} />}
          </div>

          <div className="file-preview-right">
            <div className="file-name">{filePreview.name}</div>
            <div className="file-size">{formatBytes(filePreview.size)}</div>
            <div className="preview-actions">
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
                className="preview-btn"
              >
                Change
              </button>
              <button
                onClick={() => {
                  if (filePreview.isObjectURL) URL.revokeObjectURL(filePreview.url);
                  setFile(null);
                  setFilePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="preview-btn remove"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="input-box">
        <input
          type="text"
          placeholder={editId ? "Edit message..." : "Type a message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button onClick={() => fileInputRef.current.click()} className="icon-btn attach">
          <Paperclip size={18} />
        </button>
        <button onClick={sendMessage} className="icon-btn send">
          <Send size={18} />
        </button>
      </div>

      {overlay && (
        <div className="overlay" onClick={closeOverlay}>
          {overlay.type === "image" && (
            <img src={overlay.content} alt="Preview" className="overlay-content" />
          )}
          {overlay.type === "video" && (
            <video controls autoPlay className="overlay-content">
              <source src={overlay.content} type="video/mp4" />
            </video>
          )}
          <span className="close-overlay" onClick={closeOverlay}>
            ×
          </span>
        </div>
      )}
    </div>
  );
}

// import { useState, useRef, useEffect } from "react";
// import "./chat.css";
// import { Send, Paperclip, Image, X, Trash2, Reply, Download, Eye } from "lucide-react";


// export default function ChatStatic() {
//   const [messages, setMessages] = useState([
//     { id: 1, sender: "friend", type: "text", content: "Hey Yara! 🌸", reply_to: null, is_edited: false },
//     { id: 2, sender: "me", type: "text", content: "Hey! Check this out 👇", reply_to: null, is_edited: false },
//     { id: 3, sender: "me", type: "image", content: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500", reply_to: null, is_edited: false },
//   ]);

//   const [input, setInput] = useState("");
//   const [file, setFile] = useState(null); // real File object
//   const [filePreview, setFilePreview] = useState(null); // { type, url, name, size }
//   const [overlay, setOverlay] = useState(null);
//   const [replyTo, setReplyTo] = useState(null);
//   const [editId, setEditId] = useState(null);
//   const fileInputRef = useRef();

//   // cleanup object URLs on unmount
//   useEffect(() => {
//     return () => {
//       if (filePreview && filePreview.url && filePreview.isObjectURL) {
//         URL.revokeObjectURL(filePreview.url);
//       }
//       // revoke any local object URLs inside messages (optional)
//       messages.forEach((m) => {
//         if (m._local && m.content) {
//           try { URL.revokeObjectURL(m.content); } catch (e) {}
//         }
//       });
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const findMessageById = (id) => messages.find((m) => m.id === id);

//   // handle file selection and create preview
//   const handleFileChange = (e) => {
//     const f = e.target.files && e.target.files[0];
//     if (!f) return;

//     // revoke previous preview url if it was an object URL
//     if (filePreview && filePreview.isObjectURL) {
//       try { URL.revokeObjectURL(filePreview.url); } catch (e) {}
//     }

//     const type = f.type;
//     const isImage = type.startsWith("image/");
//     const isVideo = type.startsWith("video/");
//     const url = URL.createObjectURL(f);

//     setFile(f);
//     setFilePreview({
//       type: isImage ? "image" : isVideo ? "video" : "file",
//       url,
//       name: f.name,
//       size: f.size,
//       isObjectURL: true,
//     });
//   };

//   // small helper to format bytes
//   const formatBytes = (bytes) => {
//     if (bytes === 0) return "0 B";
//     const k = 1024;
//     const sizes = ["B", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
//   };

//   // open overlay (for image/video)
//   const openOverlay = (msg) => {
//     if (msg.type === "image" || msg.type === "video") setOverlay(msg);
//   };
//   const closeOverlay = (e) => {
//     e.stopPropagation();
//     setOverlay(null);
//   };

//   // reply
//   const replyMessage = (msg) => {
//     setReplyTo(msg);
//     setEditId(null);
//     setInput("");
//     // keep file unchanged
//   };

//   // edit
//   const editMessage = (msg) => {
//     if (msg.sender !== "me") return;
//     if (msg.type !== "text") return; // only text editing for now
//     setEditId(msg.id);
//     setInput(msg.content);
//     setReplyTo(null);
//     setFile(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//     setFilePreview(null);
//   };

//   // delete
//   const deleteMessage = (msg) => {
//     if (msg.sender !== "me") return;
//     if (!window.confirm("Are you sure you want to delete this message?")) return;
//     setMessages((prev) => prev.filter((m) => m.id !== msg.id));
//     if (replyTo && replyTo.id === msg.id) setReplyTo(null);
//     if (editId === msg.id) {
//       setEditId(null);
//       setInput("");
//     }
//   };

//   // send or update
//   const sendMessage = () => {
//     if (!input.trim() && !file) return;

//     // update existing message
//     if (editId) {
//       setMessages((prev) =>
//         prev.map((m) => (m.id === editId ? { ...m, content: input, is_edited: true } : m))
//       );
//       setEditId(null);
//       setInput("");
//       setFile(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//       setFilePreview(null);
//       return;
//     }

//     // new message
//     let newMsg;
//     if (file && filePreview) {
//       // use the object URL for display (static)
//       newMsg = {
//         id: Date.now(),
//         sender: "me",
//         type: filePreview.type,
//         content: filePreview.url,
//         filename: filePreview.name,
//         reply_to: replyTo ? replyTo.id : null,
//         is_edited: false,
//         _local: true, // mark local blob for optional cleanup
//       };
//     } else {
//       newMsg = {
//         id: Date.now(),
//         sender: "me",
//         type: "text",
//         content: input,
//         reply_to: replyTo ? replyTo.id : null,
//         is_edited: false,
//       };
//     }

//     setMessages((prev) => [...prev, newMsg]);
//     setInput("");
//     setFile(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//     setFilePreview(null);
//     setReplyTo(null);
//   };

//   const renderRepliedSnippet = (msg) => {
//     if (!msg.reply_to) return null;
//     const replied = findMessageById(msg.reply_to);
//     if (!replied) return null;
//     const text = replied.type === "text" ? replied.content : replied.type.toUpperCase();
//     return (
//       <div className="reply-line">
//         ↪ Replied to: <span className="reply-text">{String(text).slice(0, 40)}{String(text).length > 40 ? "..." : ""}</span>
//       </div>
//     );
//   };

//   return (
//     <div className="chat-container">
//       <h2>💬 Chat (Static)</h2>

//       <div className="messages-box">
//         {messages.length === 0 && <div className="empty">No messages yet...</div>}

//         {messages.map((msg) => (
//           <div
//             key={msg.id}
//             className={`message ${msg.sender === "me" ? "sent" : "received"} ${msg.reply_to ? "reply-msg" : ""}`}
//           >
//             {renderRepliedSnippet(msg)}

//             {msg.type === "text" && <p className="msg-text">{msg.content}{msg.is_edited && <span className="edited"> (edited)</span>}</p>}

//             {msg.type === "image" && (
//               <img src={msg.content} alt="sent" className="chat-media" onClick={() => openOverlay(msg)} />
//             )}

//             {msg.type === "video" && (
//               <video className="chat-media" onClick={() => openOverlay(msg)} controls>
//                 <source src={msg.content} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             )}

//             {msg.type === "file" && (
//               <a href={msg.content} target="_blank" rel="noreferrer" className="file-link">{msg.filename ? `📎 ${msg.filename}` : "📎 File"}</a>
//             )}

//             <div className="actions">
//               <button className="action-btn" onClick={() => replyMessage(msg)}>↩️ Reply</button>
//               {msg.sender === "me" && (
//                 <>
//                   {msg.type === "text" && <button className="action-btn" onClick={() => editMessage(msg)}>✏️ Edit</button>}
//                   <button className="action-btn" onClick={() => deleteMessage(msg)}>🗑️ Delete</button>
//                 </>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* reply preview */}
//       {replyTo && (
//         <div className="reply-preview">
//           Replying to: <span>{replyTo.type === "text" ? replyTo.content.slice(0, 60) : replyTo.type.toUpperCase()}</span>
//           <button onClick={() => setReplyTo(null)}>✖</button>
//         </div>
//       )}

//       {/* FILE PREVIEW AREA (before sending) */}
//       {filePreview && (
//         <div className="file-preview">
//           <div className="file-preview-left">
//             {filePreview.type === "image" && <img src={filePreview.url} alt="preview" className="preview-thumb" />}
//             {filePreview.type === "video" && (
//               <video className="preview-thumb" controls>
//                 <source src={filePreview.url} />
//               </video>
//             )}
//             {filePreview.type === "file" && (
//               <div className="preview-file-icon">📎</div>
//             )}
//           </div>

//           <div className="file-preview-right">
//             <div className="file-name">{filePreview.name}</div>
//             <div className="file-size">{formatBytes(filePreview.size)}</div>
//             <div className="preview-actions">
//             <button
//   onClick={() => {
//     // clear old selection so user can pick again (even same file)
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//       fileInputRef.current.click();
//     }
//   }}
//   className="preview-btn"
// >
//   Change
// </button>

//               <button onClick={() => {
//                 // remove preview
//                 if (filePreview.isObjectURL) {
//                   try { URL.revokeObjectURL(filePreview.url); } catch (e) {}
//                 }
//                 setFile(null);
//                 setFilePreview(null);
//                 if (fileInputRef.current) fileInputRef.current.value = "";
//               }} className="preview-btn remove">Remove</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* input */}
//       <div className="input-box">
//         <input
//           type="text"
//           placeholder={editId ? "Edit message..." : "Type a message..."}
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//         />
//         <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
//         <button onClick={() => fileInputRef.current.click()} title="Attach file">📎</button>
//         <button onClick={sendMessage}>{editId ? "Update" : "Send"}</button>
//       </div>

//       {/* overlay */}
//       {overlay && (
//         <div className="overlay" onClick={closeOverlay}>
//           {overlay.type === "image" && <img src={overlay.content} alt="Preview" className="overlay-content" />}
//           {overlay.type === "video" && (
//             <video controls autoPlay className="overlay-content">
//               <source src={overlay.content} type="video/mp4" />
//             </video>
//           )}
//           <span className="close-overlay" onClick={closeOverlay}>&times;</span>
//         </div>
//       )}
//     </div>
//   );
// }
